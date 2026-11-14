-- Prevent duplicate orders when a checkout response is lost or the browser retries.
-- The application reuses its per-checkout UUID until the basket or customer details change.
begin;

alter table public.orders
  add column if not exists idempotency_key uuid,
  add column if not exists idempotency_payload_hash text;

create unique index if not exists orders_idempotency_key_uidx
  on public.orders (idempotency_key)
  where idempotency_key is not null;

drop function if exists public.place_order(text,text,text,text,text,text,text,text,text,jsonb,text);

create function public.place_order(
  p_customer_name text, p_phone text, p_email text, p_fulfillment text, p_payment_method text,
  p_city text, p_address_line text, p_postal_code text, p_customer_notes text, p_items jsonb,
  p_promo_code text default null,
  p_idempotency_key uuid default null
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
  v_discount integer := 0;
  v_total integer := 0;
  v_item record;
  v_product public.products%rowtype;
  v_promo public.promo_codes%rowtype;
  v_customer_uses bigint := 0;
  v_line_total integer;
  v_existing_order public.orders%rowtype;
  v_request_hash text;
begin
  -- Legacy callers without a key still work during rollout, but the new checkout always supplies one.
  if p_idempotency_key is null then
    p_idempotency_key := gen_random_uuid();
  end if;

  -- Serialize concurrent submissions that carry the same checkout key.
  perform pg_advisory_xact_lock(hashtextextended(p_idempotency_key::text, 0));

  -- Hash the complete submitted request so a key cannot be reused for a different basket or customer.
  v_request_hash := encode(extensions.digest(convert_to(jsonb_build_object(
    'customer_name', trim(p_customer_name),
    'phone', regexp_replace(trim(p_phone), '[[:space:]]+', '', 'g'),
    'email', lower(trim(p_email)),
    'fulfillment', p_fulfillment,
    'payment_method', p_payment_method,
    'city', trim(coalesce(p_city, '')),
    'address_line', trim(coalesce(p_address_line, '')),
    'postal_code', trim(coalesce(p_postal_code, '')),
    'customer_notes', trim(coalesce(p_customer_notes, '')),
    'items', p_items,
    'promo_code', upper(trim(coalesce(p_promo_code, '')))
  )::text, 'UTF8'), 'sha256'), 'hex');

  -- A retry after a lost response returns the original order and guest tracking token.
  select * into v_existing_order
  from public.orders
  where idempotency_key = p_idempotency_key
  for update;
  if found then
    if v_existing_order.user_id is distinct from v_user_id
       or lower(v_existing_order.email) is distinct from lower(trim(coalesce(p_email, '')))
       or v_existing_order.idempotency_payload_hash is distinct from v_request_hash then
      raise exception 'This checkout submission key was already used for a different request. Refresh checkout and submit again';
    end if;

    v_token := case when v_user_id is null
      then encode(extensions.digest(convert_to(p_idempotency_key::text, 'UTF8'), 'sha256'), 'hex')
      else null end;

    if v_user_id is null and v_existing_order.guest_tracking_token_hash is distinct from
      encode(extensions.digest(convert_to(v_token, 'UTF8'), 'sha256'), 'hex') then
      raise exception 'The saved guest order token could not be verified';
    end if;

    return jsonb_build_object(
      'order_number', v_existing_order.order_number,
      'guest_tracking_token', v_token,
      'subtotal_pkr', v_existing_order.subtotal_pkr,
      'discount_pkr', v_existing_order.discount_pkr,
      'promo_code', v_existing_order.promo_code,
      'delivery_fee_pkr', v_existing_order.delivery_fee_pkr,
      'delivery_fee_pending', v_existing_order.delivery_fee_pending,
      'total_pkr', v_existing_order.total_pkr,
      'payment_required_before_confirmation', v_existing_order.payment_required_before_confirmation
    );
  end if;
  select * into v_settings from public.store_settings where singleton = true;
  if not found or not v_settings.checkout_enabled then raise exception 'Order requests are not available right now'; end if;
  if length(trim(coalesce(p_customer_name, ''))) not between 2 and 120 then raise exception 'Enter a valid customer name'; end if;
  if length(regexp_replace(coalesce(p_phone, ''), '[^0-9+]', '', 'g')) not between 7 and 18 then raise exception 'Enter a valid phone number'; end if;
  if length(trim(coalesce(p_email, ''))) > 254 or position('@' in coalesce(p_email, '')) < 2 then raise exception 'Enter a valid email address'; end if;
  if p_fulfillment not in ('delivery', 'pickup') then raise exception 'Choose a valid fulfilment method'; end if;
  if p_payment_method not in ('jazzcash', 'easypaisa', 'ubl_bank') then raise exception 'Choose a valid preferred payment method'; end if;
  if p_payment_method = 'jazzcash' and not v_settings.jazzcash_enabled then raise exception 'JazzCash is not enabled right now'; end if;
  if p_payment_method = 'easypaisa' and not v_settings.easypaisa_enabled then raise exception 'Easypaisa is not enabled right now'; end if;
  if p_payment_method = 'ubl_bank' and not v_settings.ubl_bank_enabled then raise exception 'UBL Bank transfer is not enabled right now'; end if;
  if p_fulfillment = 'pickup' and not v_settings.pickup_enabled then raise exception 'Shop pickup is unavailable'; end if;
  if p_fulfillment = 'delivery' then
    if not v_settings.delivery_enabled then raise exception 'Home delivery is not available yet'; end if;
    if length(trim(coalesce(p_city, ''))) < 2 or length(trim(coalesce(p_address_line, ''))) < 5 then raise exception 'Enter the delivery city and complete address'; end if;
    if v_settings.delivery_fee_pkr is null then v_delivery_fee := 0; v_delivery_fee_pending := true;
    else v_delivery_fee := v_settings.delivery_fee_pkr; end if;
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) < 1 or jsonb_array_length(p_items) > 20 then raise exception 'Your cart is empty or contains too many products'; end if;

  for v_item in
    select product_id, sum(quantity)::integer as quantity
    from jsonb_to_recordset(p_items) as item(product_id uuid, quantity integer)
    group by product_id order by product_id
  loop
    if v_item.product_id is null or v_item.quantity is null or v_item.quantity < 1 or v_item.quantity > 10 then raise exception 'A cart item is invalid'; end if;
    select * into v_product from public.products where id = v_item.product_id and status = 'active' for update;
    if not found then raise exception 'A product is no longer available'; end if;
    if v_product.price_pkr is null or v_product.price_pkr <= 0 then raise exception 'A product price is not available'; end if;
    if v_product.stock < v_item.quantity then raise exception 'A product does not have enough stock'; end if;
    v_subtotal := v_subtotal + (v_product.price_pkr * v_item.quantity);
  end loop;
  if v_subtotal <= 0 then raise exception 'The order subtotal is invalid'; end if;

  if nullif(upper(trim(coalesce(p_promo_code, ''))), '') is not null then
    select * into v_promo from public.promo_codes where code = upper(trim(p_promo_code)) for update;
    if not found or not v_promo.is_active
       or (v_promo.starts_at is not null and v_promo.starts_at > now())
       or (v_promo.expires_at is not null and v_promo.expires_at <= now())
       or (v_promo.usage_limit is not null and v_promo.usage_count >= v_promo.usage_limit)
       or v_subtotal < v_promo.minimum_order_pkr then
      raise exception 'Promo code is invalid, expired or not eligible for this order';
    end if;
    select count(*) into v_customer_uses from public.promo_code_redemptions
    where promo_code_id = v_promo.id and lower(customer_email) = lower(trim(p_email));
    if v_customer_uses >= v_promo.per_customer_limit then raise exception 'Promo code has reached its per-customer usage limit'; end if;
    if v_promo.discount_type = 'percentage' then
      v_discount := floor(v_subtotal * v_promo.discount_value / 100.0)::integer;
      if v_promo.maximum_discount_pkr is not null then v_discount := least(v_discount, v_promo.maximum_discount_pkr); end if;
    else v_discount := v_promo.discount_value; end if;
    v_discount := least(greatest(v_discount, 0), v_subtotal);
  end if;

  v_total := v_subtotal - v_discount + v_delivery_fee;
  v_order_number := format('MLS-%s-%s', to_char(now(), 'YY'), lpad(nextval('public.mr_lapshop_order_sequence')::text, 6, '0'));
  v_token := case when v_user_id is null
    then encode(extensions.digest(convert_to(p_idempotency_key::text, 'UTF8'), 'sha256'), 'hex')
    else null end;
  insert into public.orders (
    order_number, user_id, guest_tracking_token_hash, customer_name, phone, email,
    fulfillment, payment_method, payment_status, city, address_line, postal_code,
    customer_notes, subtotal_pkr, delivery_fee_pkr, total_pkr, delivery_fee_pending,
    payment_required_before_confirmation, promo_code_id, promo_code, discount_pkr,
    idempotency_key, idempotency_payload_hash
  ) values (
    v_order_number, v_user_id,
    case when v_user_id is null then encode(extensions.digest(convert_to(v_token, 'UTF8'), 'sha256'), 'hex') else null end,
    trim(p_customer_name), regexp_replace(trim(p_phone), '[[:space:]]+', '', 'g'), lower(trim(p_email)),
    p_fulfillment::public.fulfillment_method, p_payment_method::public.payment_method, 'pending'::public.payment_status,
    case when p_fulfillment = 'delivery' then trim(p_city) else null end,
    case when p_fulfillment = 'delivery' then trim(p_address_line) else null end,
    nullif(trim(coalesce(p_postal_code, '')), ''), nullif(trim(coalesce(p_customer_notes, '')), ''),
    v_subtotal, v_delivery_fee, v_total, v_delivery_fee_pending, true,
    case when v_discount > 0 then v_promo.id else null end,
    case when v_discount > 0 then v_promo.code else null end, v_discount,
    p_idempotency_key, v_request_hash
  ) returning id into v_order_id;

  for v_item in
    select product_id, sum(quantity)::integer as quantity
    from jsonb_to_recordset(p_items) as item(product_id uuid, quantity integer)
    group by product_id order by product_id
  loop
    select * into v_product from public.products where id = v_item.product_id for update;
    v_line_total := v_product.price_pkr * v_item.quantity;
    insert into public.order_items (
      order_id, product_id, title_snapshot, sku_snapshot, condition_snapshot, unit_price_pkr, quantity, line_total_pkr
    ) values (v_order_id, v_product.id, v_product.title, v_product.sku, v_product.condition,
      v_product.price_pkr, v_item.quantity, v_line_total);
  end loop;

  if v_discount > 0 then
    insert into public.promo_code_redemptions (promo_code_id, order_id, user_id, customer_email, discount_pkr)
    values (v_promo.id, v_order_id, v_user_id, lower(trim(p_email)), v_discount);
    update public.promo_codes set usage_count = usage_count + 1, updated_at = now() where id = v_promo.id;
  end if;

  return jsonb_build_object('order_number', v_order_number,
    'guest_tracking_token', case when v_user_id is null then v_token else null end,
    'subtotal_pkr', v_subtotal, 'discount_pkr', v_discount,
    'promo_code', case when v_discount > 0 then v_promo.code else null end,
    'delivery_fee_pkr', v_delivery_fee, 'delivery_fee_pending', v_delivery_fee_pending,
    'total_pkr', v_total, 'payment_required_before_confirmation', true);
end;
$function$;

revoke all on function public.place_order(text,text,text,text,text,text,text,text,text,jsonb,text,uuid) from public, anon, authenticated;
grant execute on function public.place_order(text,text,text,text,text,text,text,text,text,jsonb,text,uuid) to anon, authenticated;

commit;
