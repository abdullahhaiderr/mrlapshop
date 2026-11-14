alter table public.store_settings
  add column if not exists jazzcash_enabled boolean not null default true,
  add column if not exists easypaisa_enabled boolean not null default true,
  add column if not exists ubl_bank_enabled boolean not null default true;

alter table public.orders
  add column if not exists promo_code_id uuid,
  add column if not exists promo_code text,
  add column if not exists discount_pkr integer not null default 0;

create table if not exists public.promo_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code = upper(code) and code ~ '^[A-Z0-9][A-Z0-9_-]{3,31}$'),
  description text check (description is null or char_length(description) <= 240),
  discount_type text not null check (discount_type in ('percentage', 'fixed')),
  discount_value integer not null check (discount_value > 0),
  minimum_order_pkr integer not null default 0 check (minimum_order_pkr >= 0),
  maximum_discount_pkr integer check (maximum_discount_pkr is null or maximum_discount_pkr > 0),
  usage_limit integer check (usage_limit is null or usage_limit > 0),
  usage_count integer not null default 0 check (usage_count >= 0),
  per_customer_limit integer not null default 1 check (per_customer_limit > 0),
  starts_at timestamptz,
  expires_at timestamptz,
  is_active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint promo_percentage_range check (discount_type <> 'percentage' or discount_value <= 100),
  constraint promo_date_order check (starts_at is null or expires_at is null or expires_at > starts_at)
);

create table if not exists public.promo_code_redemptions (
  id uuid primary key default gen_random_uuid(),
  promo_code_id uuid not null references public.promo_codes(id) on delete restrict,
  order_id uuid not null unique references public.orders(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  customer_email text not null,
  discount_pkr integer not null check (discount_pkr > 0),
  created_at timestamptz not null default now()
);

alter table public.orders drop constraint if exists orders_promo_code_id_fkey;
alter table public.orders add constraint orders_promo_code_id_fkey
  foreign key (promo_code_id) references public.promo_codes(id) on delete set null;

create index if not exists promo_codes_active_expiry_idx on public.promo_codes (is_active, expires_at);
create index if not exists promo_redemptions_code_email_idx on public.promo_code_redemptions (promo_code_id, lower(customer_email));

alter table public.promo_codes enable row level security;
alter table public.promo_code_redemptions enable row level security;

drop policy if exists "Owner can read promo codes" on public.promo_codes;
create policy "Owner can read promo codes" on public.promo_codes for select to authenticated
  using (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid())));
drop policy if exists "Owner can create promo codes" on public.promo_codes;
create policy "Owner can create promo codes" on public.promo_codes for insert to authenticated
  with check (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid())));
drop policy if exists "Owner can update promo codes" on public.promo_codes;
create policy "Owner can update promo codes" on public.promo_codes for update to authenticated
  using (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid())))
  with check (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid())));
drop policy if exists "Owner can delete promo codes" on public.promo_codes;
create policy "Owner can delete promo codes" on public.promo_codes for delete to authenticated
  using (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid())));
drop policy if exists "Owner can read promo redemptions" on public.promo_code_redemptions;
create policy "Owner can read promo redemptions" on public.promo_code_redemptions for select to authenticated
  using (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid())));

revoke all on public.promo_code_redemptions from anon, authenticated;
grant select on public.promo_code_redemptions to authenticated;
revoke insert, update, delete on public.promo_code_redemptions from anon, authenticated;
grant select, insert, update, delete on public.promo_codes to authenticated;
revoke all on public.promo_codes from anon;

create or replace function public.get_public_checkout_settings()
returns jsonb language sql stable security definer set search_path = public
as $function$
  select jsonb_build_object(
    'checkout_enabled', checkout_enabled,
    'pickup_enabled', pickup_enabled,
    'delivery_enabled', delivery_enabled,
    'delivery_fee_pkr', delivery_fee_pkr,
    'cash_on_delivery_enabled', cash_on_delivery_enabled,
    'bank_transfer_enabled', bank_transfer_enabled,
    'cash_at_pickup_enabled', cash_at_pickup_enabled,
    'jazzcash_enabled', jazzcash_enabled,
    'easypaisa_enabled', easypaisa_enabled,
    'ubl_bank_enabled', ubl_bank_enabled
  ) from public.store_settings where singleton = true;
$function$;

create or replace function public.validate_promo_code(p_code text, p_subtotal integer, p_email text)
returns jsonb language plpgsql stable security definer set search_path = public
as $function$
declare
  v_promo public.promo_codes%rowtype;
  v_customer_uses bigint := 0;
  v_discount integer := 0;
begin
  if nullif(upper(trim(coalesce(p_code, ''))), '') is null then
    return jsonb_build_object('valid', false, 'message', 'Enter a promo code.');
  end if;
  if coalesce(p_subtotal, 0) <= 0 then
    return jsonb_build_object('valid', false, 'message', 'Add a valid product to your cart first.');
  end if;
  select * into v_promo from public.promo_codes where code = upper(trim(p_code)) limit 1;
  if not found or not v_promo.is_active
     or (v_promo.starts_at is not null and v_promo.starts_at > now())
     or (v_promo.expires_at is not null and v_promo.expires_at <= now())
     or (v_promo.usage_limit is not null and v_promo.usage_count >= v_promo.usage_limit)
     or p_subtotal < v_promo.minimum_order_pkr then
    return jsonb_build_object('valid', false, 'message', 'This promo code is invalid, expired or not eligible for this order.');
  end if;
  if nullif(lower(trim(coalesce(p_email, ''))), '') is not null then
    select count(*) into v_customer_uses from public.promo_code_redemptions
    where promo_code_id = v_promo.id and lower(customer_email) = lower(trim(p_email));
    if v_customer_uses >= v_promo.per_customer_limit then
      return jsonb_build_object('valid', false, 'message', 'This promo code has already been used the maximum number of times for this email.');
    end if;
  end if;
  if v_promo.discount_type = 'percentage' then
    v_discount := floor(p_subtotal * v_promo.discount_value / 100.0)::integer;
    if v_promo.maximum_discount_pkr is not null then v_discount := least(v_discount, v_promo.maximum_discount_pkr); end if;
  else
    v_discount := v_promo.discount_value;
  end if;
  v_discount := least(greatest(v_discount, 0), p_subtotal);
  return jsonb_build_object('valid', true, 'code', v_promo.code, 'discount_pkr', v_discount,
    'discount_type', v_promo.discount_type, 'discount_value', v_promo.discount_value);
end;
$function$;

drop function if exists public.place_order(text,text,text,text,text,text,text,text,text,jsonb);
create function public.place_order(
  p_customer_name text, p_phone text, p_email text, p_fulfillment text, p_payment_method text,
  p_city text, p_address_line text, p_postal_code text, p_customer_notes text, p_items jsonb,
  p_promo_code text default null
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
begin
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
  v_token := encode(extensions.gen_random_bytes(32), 'hex');
  insert into public.orders (
    order_number, user_id, guest_tracking_token_hash, customer_name, phone, email,
    fulfillment, payment_method, payment_status, city, address_line, postal_code,
    customer_notes, subtotal_pkr, delivery_fee_pkr, total_pkr, delivery_fee_pending,
    payment_required_before_confirmation, promo_code_id, promo_code, discount_pkr
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
    case when v_discount > 0 then v_promo.code else null end, v_discount
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

revoke all on function public.validate_promo_code(text, integer, text) from public;
grant execute on function public.validate_promo_code(text, integer, text) to anon, authenticated;
revoke all on function public.place_order(text,text,text,text,text,text,text,text,text,jsonb,text) from public;
grant execute on function public.place_order(text,text,text,text,text,text,text,text,text,jsonb,text) to anon, authenticated;
