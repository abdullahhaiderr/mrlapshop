alter table public.products add column if not exists performance_pick boolean not null default false;
create index if not exists products_performance_pick_idx
  on public.products (performance_pick, created_at desc)
  where status = 'active' and performance_pick = true;

alter table public.orders add column if not exists delivery_fee_pending boolean not null default false;
update public.store_settings set delivery_fee_pkr = null, updated_at = now() where singleton = true;

create or replace function public.place_order(
  p_customer_name text, p_phone text, p_email text, p_fulfillment text,
  p_payment_method text, p_city text, p_address_line text, p_postal_code text,
  p_customer_notes text, p_items jsonb
)
returns jsonb language plpgsql security definer set search_path = public, extensions
as $function$
declare
  v_user_id uuid := auth.uid();
  v_settings public.store_settings%rowtype;
  v_order_id uuid;
  v_order_number text;
  v_token text;
  v_delivery_fee integer := 0;
  v_delivery_fee_pending boolean := false;
  v_subtotal integer := 0;
  v_total integer := 0;
  v_item record;
  v_product public.products%rowtype;
  v_line_total integer;
begin
  select * into v_settings from public.store_settings where singleton = true;
  if not found or not v_settings.checkout_enabled then raise exception 'Order requests are not available right now'; end if;
  if length(trim(coalesce(p_customer_name, ''))) not between 2 and 120 then raise exception 'Enter a valid customer name'; end if;
  if length(regexp_replace(coalesce(p_phone, ''), '[^0-9+]', '', 'g')) not between 7 and 18 then raise exception 'Enter a valid phone number'; end if;
  if length(trim(coalesce(p_email, ''))) > 254 or position('@' in coalesce(p_email, '')) < 2 then raise exception 'Enter a valid email address'; end if;
  if p_fulfillment not in ('delivery', 'pickup') then raise exception 'Choose a valid fulfilment method'; end if;
  if p_payment_method not in ('jazzcash', 'easypaisa', 'ubl_bank') then raise exception 'Choose a valid preferred payment method'; end if;
  if p_fulfillment = 'pickup' and not v_settings.pickup_enabled then raise exception 'Shop pickup is unavailable'; end if;
  if p_fulfillment = 'delivery' then
    if not v_settings.delivery_enabled then raise exception 'Home delivery is not available yet'; end if;
    if length(trim(coalesce(p_city, ''))) < 2 or length(trim(coalesce(p_address_line, ''))) < 5 then raise exception 'Enter the delivery city and complete address'; end if;
    if v_settings.delivery_fee_pkr is null then v_delivery_fee := 0; v_delivery_fee_pending := true;
    else v_delivery_fee := v_settings.delivery_fee_pkr; end if;
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) < 1 or jsonb_array_length(p_items) > 20 then raise exception 'Your cart is empty or contains too many products'; end if;
  for v_item in select product_id, sum(quantity)::integer as quantity from jsonb_to_recordset(p_items) as item(product_id uuid, quantity integer) group by product_id order by product_id loop
    if v_item.product_id is null or v_item.quantity is null or v_item.quantity < 1 or v_item.quantity > 10 then raise exception 'A cart item is invalid'; end if;
    select * into v_product from public.products where id = v_item.product_id and status = 'active' for update;
    if not found then raise exception 'A product is no longer available'; end if;
    if v_product.price_pkr is null or v_product.price_pkr <= 0 then raise exception 'A product price is not available'; end if;
    if v_product.stock < v_item.quantity then raise exception 'A product does not have enough stock'; end if;
    v_subtotal := v_subtotal + (v_product.price_pkr * v_item.quantity);
  end loop;
  if v_subtotal <= 0 then raise exception 'The order subtotal is invalid'; end if;
  v_total := v_subtotal + v_delivery_fee;
  v_order_number := format('MLS-%s-%s', to_char(now(), 'YY'), lpad(nextval('public.mr_lapshop_order_sequence')::text, 6, '0'));
  v_token := encode(extensions.gen_random_bytes(32), 'hex');
  insert into public.orders (order_number, user_id, guest_tracking_token_hash, customer_name, phone, email, fulfillment, payment_method, payment_status, city, address_line, postal_code, customer_notes, subtotal_pkr, delivery_fee_pkr, total_pkr, delivery_fee_pending, payment_required_before_confirmation)
  values (v_order_number, v_user_id, case when v_user_id is null then encode(extensions.digest(convert_to(v_token, 'UTF8'), 'sha256'), 'hex') else null end,
    trim(p_customer_name), regexp_replace(trim(p_phone), '\s+', '', 'g'), lower(trim(p_email)),
    p_fulfillment::public.fulfillment_method, p_payment_method::public.payment_method, 'pending'::public.payment_status,
    case when p_fulfillment = 'delivery' then trim(p_city) else null end,
    case when p_fulfillment = 'delivery' then trim(p_address_line) else null end,
    nullif(trim(coalesce(p_postal_code, '')), ''), nullif(trim(coalesce(p_customer_notes, '')), ''),
    v_subtotal, v_delivery_fee, v_total, v_delivery_fee_pending, true)
  returning id into v_order_id;
  for v_item in select product_id, sum(quantity)::integer as quantity from jsonb_to_recordset(p_items) as item(product_id uuid, quantity integer) group by product_id order by product_id loop
    select * into v_product from public.products where id = v_item.product_id for update;
    v_line_total := v_product.price_pkr * v_item.quantity;
    insert into public.order_items (order_id, product_id, title_snapshot, sku_snapshot, condition_snapshot, unit_price_pkr, quantity, line_total_pkr)
    values (v_order_id, v_product.id, v_product.title, v_product.sku, v_product.condition, v_product.price_pkr, v_item.quantity, v_line_total);
    -- Do not reserve/decrement stock until owner confirmation after payment verification.
  end loop;
  return jsonb_build_object('order_number', v_order_number, 'guest_tracking_token', case when v_user_id is null then v_token else null end,
    'subtotal_pkr', v_subtotal, 'delivery_fee_pkr', v_delivery_fee, 'delivery_fee_pending', v_delivery_fee_pending,
    'total_pkr', v_total, 'payment_required_before_confirmation', true);
end;
$function$;
revoke all on function public.place_order(text, text, text, text, text, text, text, text, text, jsonb) from public;
grant execute on function public.place_order(text, text, text, text, text, text, text, text, text, jsonb) to anon, authenticated;

comment on column public.orders.delivery_fee_pending is 'True when a delivery request was submitted before the shop quoted the delivery fee.';
comment on column public.orders.payment_required_before_confirmation is 'The full payment must be verified by the shop before the order is confirmed.';
