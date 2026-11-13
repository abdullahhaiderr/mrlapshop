create or replace function public.track_guest_order(p_order_number text, p_tracking_token text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $function$
declare
  v_order public.orders%rowtype;
  v_items jsonb;
begin
  if length(coalesce(p_tracking_token, '')) <> 64 then raise exception 'Order not found'; end if;
  select * into v_order from public.orders
  where order_number = p_order_number
    and guest_tracking_token_hash = encode(extensions.digest(convert_to(p_tracking_token, 'UTF8'), 'sha256'), 'hex')
    and user_id is null;
  if not found then raise exception 'Order not found'; end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'title', title_snapshot,
    'quantity', quantity,
    'unit_price_pkr', unit_price_pkr,
    'line_total_pkr', line_total_pkr
  ) order by created_at), '[]'::jsonb)
  into v_items from public.order_items where order_id = v_order.id;
  return jsonb_build_object(
    'order_number', v_order.order_number,
    'status', v_order.status,
    'payment_status', v_order.payment_status,
    'fulfillment', v_order.fulfillment,
    'payment_method', v_order.payment_method,
    'customer_name', v_order.customer_name,
    'subtotal_pkr', v_order.subtotal_pkr,
    'delivery_fee_pkr', v_order.delivery_fee_pkr,
    'delivery_fee_pending', v_order.delivery_fee_pending,
    'payment_required_before_confirmation', v_order.payment_required_before_confirmation,
    'total_pkr', v_order.total_pkr,
    'created_at', v_order.created_at,
    'items', v_items
  );
end;
$function$;
revoke all on function public.track_guest_order(text, text) from public;
grant execute on function public.track_guest_order(text, text) to anon, authenticated;
