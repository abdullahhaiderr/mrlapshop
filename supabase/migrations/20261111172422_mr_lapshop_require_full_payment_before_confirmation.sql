create or replace function private.guard_order_confirmation_and_decrement_stock()
returns trigger language plpgsql security definer set search_path = ''
as $function$
declare v_item record;
begin
  if old.status = 'new' and new.status not in ('new', 'cancelled') then
    if not coalesce(private.is_store_owner(), false) then raise exception 'Only the shop owner can confirm an order'; end if;
    if new.payment_status <> 'paid' then raise exception 'Full payment must be verified before confirming or processing this order'; end if;
    for v_item in
      select oi.product_id, sum(oi.quantity)::integer as quantity
      from public.order_items oi where oi.order_id = new.id and oi.product_id is not null
      group by oi.product_id order by oi.product_id
    loop
      update public.products p set stock = p.stock - v_item.quantity, updated_at = now()
      where p.id = v_item.product_id and p.status = 'active' and p.stock >= v_item.quantity;
      if not found then raise exception 'Insufficient stock for one or more products; the order cannot be confirmed'; end if;
    end loop;
  end if;
  return new;
end;
$function$;
revoke all on function private.guard_order_confirmation_and_decrement_stock() from public, anon, authenticated;
drop trigger if exists orders_guard_confirmation_and_stock on public.orders;
create trigger orders_guard_confirmation_and_stock
before update of status, payment_status on public.orders
for each row
when (old.status is distinct from new.status or old.payment_status is distinct from new.payment_status)
execute function private.guard_order_confirmation_and_decrement_stock();
comment on function private.guard_order_confirmation_and_decrement_stock() is
  'When a new request leaves the new state, require verified full payment and deduct stock atomically.';
