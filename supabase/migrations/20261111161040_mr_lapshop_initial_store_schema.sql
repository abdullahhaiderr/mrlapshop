-- Mr LapShop Version 1.5
-- Core catalogue, customer profiles, owner permissions, orders and marketing consent.
-- Apply to a NEW development Supabase project before configuring application credentials.

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

create type public.product_condition as enum ('new', 'used', 'open_box');
create type public.product_status as enum ('draft', 'active', 'archived');
create type public.order_status as enum ('new', 'confirmed', 'packed', 'dispatched', 'delivered', 'cancelled');
create type public.fulfillment_method as enum ('delivery', 'pickup');
create type public.payment_method as enum ('cod', 'bank_transfer', 'cash_at_pickup');
create type public.payment_status as enum ('pending', 'awaiting_transfer', 'paid', 'failed', 'refunded');
create type public.newsletter_status as enum ('pending', 'subscribed', 'unsubscribed');

create sequence public.mr_lapshop_order_sequence start 1 increment 1;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  email_verified boolean not null default false,
  full_name text not null default '',
  phone text,
  marketing_opt_in boolean not null default false,
  marketing_opt_in_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_email_lowercase check (email = lower(email))
);

create table public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'owner' check (role = 'owner'),
  created_at timestamptz not null default now()
);
create unique index admin_users_single_owner_idx on public.admin_users(role);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  category_group text not null default 'Laptops' check (category_group in ('Laptops', 'Accessories')),
  parent_id uuid references public.categories(id) on delete set null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete set null,
  slug text not null unique,
  sku text unique,
  brand text not null,
  series text,
  model text,
  title text not null,
  condition public.product_condition not null,
  cosmetic_grade text,
  cpu_family text,
  cpu_model text,
  generation text,
  ram_gb integer check (ram_gb is null or ram_gb > 0),
  ram_type text,
  storage_gb integer check (storage_gb is null or storage_gb > 0),
  storage_type text,
  screen_in numeric(4,1) check (screen_in is null or screen_in > 0),
  resolution text,
  touch boolean not null default false,
  two_in_one boolean not null default false,
  gpu text,
  operating_system text,
  battery_note text,
  weight_kg numeric(5,2),
  warranty_months integer check (warranty_months is null or warranty_months >= 0),
  warranty_terms text,
  use_cases text[] not null default '{}',
  price_pkr integer check (price_pkr is null or price_pkr >= 0),
  compare_at_pkr integer check (compare_at_pkr is null or compare_at_pkr >= 0),
  stock integer not null default 0 check (stock >= 0),
  status public.product_status not null default 'draft',
  featured boolean not null default false,
  short_description text,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_compare_price_valid check (compare_at_pkr is null or price_pkr is null or compare_at_pkr >= price_pkr)
);

create index products_status_idx on public.products(status);
create index products_brand_idx on public.products(brand);
create index products_price_idx on public.products(price_pkr);
create index products_condition_idx on public.products(condition);
create index products_category_idx on public.products(category_id);
create index products_featured_idx on public.products(featured) where featured = true;

insert into public.categories (name, slug, category_group, sort_order) values
  ('Apple MacBooks', 'macbook', 'Laptops', 10),
  ('HP Laptops', 'hp', 'Laptops', 20),
  ('Dell Laptops', 'dell', 'Laptops', 30),
  ('Lenovo Laptops', 'lenovo', 'Laptops', 40),
  ('ASUS Laptops', 'asus', 'Laptops', 50),
  ('Chromebooks', 'chromebook', 'Laptops', 60),
  ('Headphones & Headsets', 'headphones', 'Accessories', 110),
  ('Microphones', 'microphones', 'Accessories', 120),
  ('Keyboards', 'keyboards', 'Accessories', 130),
  ('Mice', 'mice', 'Accessories', 140),
  ('Gaming Consoles', 'consoles', 'Accessories', 150),
  ('Other Accessories', 'accessories', 'Accessories', 160)
on conflict (slug) do nothing;

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  storage_path text not null,
  alt_text text not null,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  unique(product_id, storage_path)
);
create index product_images_product_position_idx on public.product_images(product_id, position);

create table public.customer_addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null default 'Home',
  recipient_name text not null,
  phone text not null,
  city text not null,
  address_line text not null,
  postal_code text,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index customer_addresses_user_idx on public.customer_addresses(user_id);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  user_id uuid references auth.users(id) on delete set null,
  guest_tracking_token_hash text,
  customer_name text not null,
  phone text not null,
  email text not null,
  fulfillment public.fulfillment_method not null,
  payment_method public.payment_method not null,
  status public.order_status not null default 'new',
  payment_status public.payment_status not null default 'pending',
  city text,
  address_line text,
  postal_code text,
  customer_notes text,
  subtotal_pkr integer not null check (subtotal_pkr >= 0),
  delivery_fee_pkr integer not null default 0 check (delivery_fee_pkr >= 0),
  total_pkr integer not null check (total_pkr >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint orders_fulfillment_address_check check (
    (fulfillment = 'pickup') or (city is not null and address_line is not null)
  )
);
create index orders_user_created_idx on public.orders(user_id, created_at desc);
create index orders_status_created_idx on public.orders(status, created_at desc);
create index orders_phone_idx on public.orders(phone);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  title_snapshot text not null,
  sku_snapshot text,
  condition_snapshot public.product_condition not null,
  unit_price_pkr integer not null check (unit_price_pkr >= 0),
  quantity integer not null check (quantity > 0),
  line_total_pkr integer not null check (line_total_pkr >= 0),
  created_at timestamptz not null default now()
);
create index order_items_order_idx on public.order_items(order_id);

create table public.newsletter_subscriptions (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  user_id uuid references auth.users(id) on delete set null,
  status public.newsletter_status not null default 'pending',
  consent_source text not null,
  consented_at timestamptz not null default now(),
  confirmed_at timestamptz,
  unsubscribe_token_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index newsletter_subscriptions_email_lower_idx on public.newsletter_subscriptions(lower(email));
create index newsletter_subscriptions_status_idx on public.newsletter_subscriptions(status);

create table public.store_settings (
  singleton boolean primary key default true check (singleton = true),
  checkout_enabled boolean not null default false,
  pickup_enabled boolean not null default true,
  delivery_enabled boolean not null default false,
  delivery_fee_pkr integer check (delivery_fee_pkr is null or delivery_fee_pkr >= 0),
  cash_on_delivery_enabled boolean not null default false,
  bank_transfer_enabled boolean not null default false,
  cash_at_pickup_enabled boolean not null default false,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);
insert into public.store_settings(singleton) values (true) on conflict (singleton) do nothing;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
create trigger categories_set_updated_at before update on public.categories
for each row execute function public.set_updated_at();
create trigger products_set_updated_at before update on public.products
for each row execute function public.set_updated_at();
create trigger customer_addresses_set_updated_at before update on public.customer_addresses
for each row execute function public.set_updated_at();
create trigger orders_set_updated_at before update on public.orders
for each row execute function public.set_updated_at();
create trigger newsletter_set_updated_at before update on public.newsletter_subscriptions
for each row execute function public.set_updated_at();

create or replace function public.handle_new_customer()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, email_verified, full_name, phone, marketing_opt_in, marketing_opt_in_at)
  values (
    new.id,
    lower(coalesce(new.email, '')),
    new.email_confirmed_at is not null,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'phone', ''),
    coalesce(new.raw_user_meta_data ->> 'marketing_opt_in', 'false') = 'true',
    case when coalesce(new.raw_user_meta_data ->> 'marketing_opt_in', 'false') = 'true' then now() else null end
  )
  on conflict (id) do update set
    email = excluded.email,
    email_verified = excluded.email_verified,
    full_name = excluded.full_name,
    phone = excluded.phone,
    marketing_opt_in = excluded.marketing_opt_in,
    marketing_opt_in_at = excluded.marketing_opt_in_at;
  return new;
end;
$$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_customer();

create or replace function public.sync_customer_email_verification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles set email_verified = (new.email_confirmed_at is not null), email = lower(coalesce(new.email, ''))
  where id = new.id;
  return new;
end;
$$;
create trigger on_auth_user_email_confirmed
  after update of email_confirmed_at on auth.users
  for each row when (old.email_confirmed_at is distinct from new.email_confirmed_at)
  execute function public.sync_customer_email_verification();

create or replace function public.is_store_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users
    where user_id = (select auth.uid()) and role = 'owner'
  );
$$;
revoke all on function public.is_store_owner() from public;
grant execute on function public.is_store_owner() to anon, authenticated;

-- Public product reads are limited to active inventory; all writes require the single owner.
alter table public.profiles enable row level security;
alter table public.admin_users enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.customer_addresses enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.newsletter_subscriptions enable row level security;
alter table public.store_settings enable row level security;

grant select on public.profiles to authenticated;
grant update (full_name, phone, marketing_opt_in, marketing_opt_in_at) on public.profiles to authenticated;
grant select on public.admin_users to authenticated;
grant select on public.categories to anon, authenticated;
grant select, insert, update, delete on public.categories to authenticated;
grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;
grant select on public.product_images to anon, authenticated;
grant insert, update, delete on public.product_images to authenticated;
grant select, insert, update, delete on public.customer_addresses to authenticated;
grant select, update on public.orders to authenticated;
grant select on public.order_items to authenticated;
grant select on public.newsletter_subscriptions, public.store_settings to authenticated;
grant update on public.store_settings to authenticated;

create policy "Customers can read their own profile" on public.profiles
for select to authenticated using ((select auth.uid()) = id);
create policy "Owner can read customer profiles" on public.profiles
for select to authenticated using ((select public.is_store_owner()));
create policy "Customers can update their own profile" on public.profiles
for update to authenticated using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "Owner can read own admin record" on public.admin_users
for select to authenticated using ((select auth.uid()) = user_id);

create policy "Anyone can read active categories" on public.categories
for select to anon, authenticated using (is_active = true or (select public.is_store_owner()));
create policy "Owner manages categories" on public.categories
for all to authenticated using ((select public.is_store_owner())) with check ((select public.is_store_owner()));

create policy "Anyone can read active products" on public.products
for select to anon, authenticated using (status = 'active' or (select public.is_store_owner()));
create policy "Owner manages products" on public.products
for all to authenticated using ((select public.is_store_owner())) with check ((select public.is_store_owner()));

create policy "Anyone can read images of active products" on public.product_images
for select to anon, authenticated using (
  exists (select 1 from public.products p where p.id = product_id and p.status = 'active')
  or (select public.is_store_owner())
);
create policy "Owner manages product images" on public.product_images
for all to authenticated using ((select public.is_store_owner())) with check ((select public.is_store_owner()));

create policy "Customers manage their own addresses" on public.customer_addresses
for all to authenticated using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Customers read their own orders" on public.orders
for select to authenticated using ((select auth.uid()) = user_id or (select public.is_store_owner()));
create policy "Owner updates orders" on public.orders
for update to authenticated using ((select public.is_store_owner())) with check ((select public.is_store_owner()));
create policy "Customers and owner read order items" on public.order_items
for select to authenticated using (
  (select public.is_store_owner())
  or exists (select 1 from public.orders o where o.id = order_id and o.user_id = (select auth.uid()))
);

create policy "Owner reads newsletter subscribers" on public.newsletter_subscriptions
for select to authenticated using ((select public.is_store_owner()));
create policy "Owner manages newsletter subscribers" on public.newsletter_subscriptions
for all to authenticated using ((select public.is_store_owner())) with check ((select public.is_store_owner()));
create policy "Owner reads store settings" on public.store_settings
for select to authenticated using ((select public.is_store_owner()));
create policy "Owner updates store settings" on public.store_settings
for update to authenticated using ((select public.is_store_owner())) with check ((select public.is_store_owner()));

-- The server-side function is the ONLY order-creation path. The client never supplies prices or totals.
create or replace function public.place_order(
  p_customer_name text,
  p_phone text,
  p_email text,
  p_fulfillment text,
  p_payment_method text,
  p_city text,
  p_address_line text,
  p_postal_code text,
  p_customer_notes text,
  p_items jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_user_id uuid := auth.uid();
  v_settings public.store_settings%rowtype;
  v_order_id uuid;
  v_order_number text;
  v_token text;
  v_delivery_fee integer := 0;
  v_subtotal integer := 0;
  v_total integer := 0;
  v_item record;
  v_product public.products%rowtype;
  v_line_total integer;
begin
  if not coalesce((select singleton from public.store_settings limit 1), false) then
    raise exception 'Store settings are not configured';
  end if;
  select * into v_settings from public.store_settings where singleton = true;
  if not v_settings.checkout_enabled then raise exception 'Online checkout is not enabled yet'; end if;
  if length(trim(coalesce(p_customer_name, ''))) not between 2 and 120 then raise exception 'Enter a valid customer name'; end if;
  if length(regexp_replace(coalesce(p_phone, ''), '[^0-9+]', '', 'g')) not between 7 and 18 then raise exception 'Enter a valid phone number'; end if;
  if length(trim(coalesce(p_email, ''))) > 254 or position('@' in coalesce(p_email, '')) < 2 then raise exception 'Enter a valid email address'; end if;
  if p_fulfillment not in ('delivery', 'pickup') then raise exception 'Choose a valid fulfilment method'; end if;
  if p_payment_method not in ('cod', 'bank_transfer', 'cash_at_pickup') then raise exception 'Choose a valid payment method'; end if;
  if p_fulfillment = 'pickup' and not v_settings.pickup_enabled then raise exception 'Shop pickup is unavailable'; end if;
  if p_fulfillment = 'delivery' then
    if not v_settings.delivery_enabled or v_settings.delivery_fee_pkr is null then raise exception 'Delivery has not been configured yet'; end if;
    if length(trim(coalesce(p_city, ''))) < 2 or length(trim(coalesce(p_address_line, ''))) < 5 then raise exception 'Enter the delivery city and complete address'; end if;
    v_delivery_fee := v_settings.delivery_fee_pkr;
  end if;
  if p_payment_method = 'cod' and not v_settings.cash_on_delivery_enabled then raise exception 'Cash on delivery is not enabled yet'; end if;
  if p_payment_method = 'bank_transfer' and not v_settings.bank_transfer_enabled then raise exception 'Bank transfer is not enabled yet'; end if;
  if p_payment_method = 'cash_at_pickup' and (p_fulfillment <> 'pickup' or not v_settings.cash_at_pickup_enabled) then raise exception 'Cash at shop pickup is not enabled yet'; end if;
  if p_payment_method = 'cod' and p_fulfillment = 'pickup' then raise exception 'Cash on delivery is not valid for shop pickup'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) < 1 or jsonb_array_length(p_items) > 20 then raise exception 'Your cart is empty or contains too many products'; end if;

  for v_item in
    select product_id, sum(quantity)::integer as quantity
    from jsonb_to_recordset(p_items) as item(product_id uuid, quantity integer)
    group by product_id
    order by product_id
  loop
    if v_item.product_id is null or v_item.quantity is null or v_item.quantity < 1 or v_item.quantity > 10 then
      raise exception 'A cart item is invalid';
    end if;
    select * into v_product from public.products
      where id = v_item.product_id and status = 'active'
      for update;
    if not found then raise exception 'A product is no longer available'; end if;
    if v_product.price_pkr is null or v_product.price_pkr <= 0 then raise exception 'A product price is not available'; end if;
    if v_product.stock < v_item.quantity then raise exception 'A product does not have enough stock'; end if;
    v_subtotal := v_subtotal + (v_product.price_pkr * v_item.quantity);
  end loop;

  if v_subtotal <= 0 then raise exception 'The order total is invalid'; end if;
  v_total := v_subtotal + v_delivery_fee;
  v_order_number := format('MLS-%s-%s', to_char(now(), 'YY'), lpad(nextval('public.mr_lapshop_order_sequence')::text, 6, '0'));
  v_token := encode(extensions.gen_random_bytes(32), 'hex');

  insert into public.orders (
    order_number, user_id, guest_tracking_token_hash, customer_name, phone, email,
    fulfillment, payment_method, payment_status, city, address_line, postal_code,
    customer_notes, subtotal_pkr, delivery_fee_pkr, total_pkr
  ) values (
    v_order_number, v_user_id,
    case when v_user_id is null then encode(extensions.digest(convert_to(v_token, 'UTF8'), 'sha256'), 'hex') else null end,
    trim(p_customer_name), regexp_replace(trim(p_phone), '\s+', '', 'g'), lower(trim(p_email)),
    p_fulfillment::public.fulfillment_method, p_payment_method::public.payment_method,
    case when p_payment_method = 'bank_transfer' then 'awaiting_transfer'::public.payment_status else 'pending'::public.payment_status end,
    case when p_fulfillment = 'delivery' then trim(p_city) else null end,
    case when p_fulfillment = 'delivery' then trim(p_address_line) else null end,
    nullif(trim(coalesce(p_postal_code, '')), ''),
    nullif(trim(coalesce(p_customer_notes, '')), ''), v_subtotal, v_delivery_fee, v_total
  ) returning id into v_order_id;

  for v_item in
    select product_id, sum(quantity)::integer as quantity
    from jsonb_to_recordset(p_items) as item(product_id uuid, quantity integer)
    group by product_id
    order by product_id
  loop
    select * into v_product from public.products where id = v_item.product_id for update;
    v_line_total := v_product.price_pkr * v_item.quantity;
    insert into public.order_items (
      order_id, product_id, title_snapshot, sku_snapshot, condition_snapshot,
      unit_price_pkr, quantity, line_total_pkr
    ) values (
      v_order_id, v_product.id, v_product.title, v_product.sku, v_product.condition,
      v_product.price_pkr, v_item.quantity, v_line_total
    );
    update public.products set stock = stock - v_item.quantity where id = v_product.id;
  end loop;

  return jsonb_build_object(
    'order_number', v_order_number,
    'guest_tracking_token', case when v_user_id is null then v_token else null end,
    'subtotal_pkr', v_subtotal,
    'delivery_fee_pkr', v_delivery_fee,
    'total_pkr', v_total
  );
end;
$$;
revoke all on function public.place_order(text, text, text, text, text, text, text, text, text, jsonb) from public;
grant execute on function public.place_order(text, text, text, text, text, text, text, text, text, jsonb) to anon, authenticated;

-- Guest tracking is a bearer-token operation. A caller cannot enumerate or read guest orders.
create or replace function public.track_guest_order(p_order_number text, p_tracking_token text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
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
    'total_pkr', v_order.total_pkr,
    'created_at', v_order.created_at,
    'items', v_items
  );
end;
$$;
revoke all on function public.track_guest_order(text, text) from public;
grant execute on function public.track_guest_order(text, text) to anon, authenticated;

-- Public product images; uploads and deletes are restricted to the owner.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 8388608, array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "Owner uploads product images" on storage.objects
for insert to authenticated with check (bucket_id = 'product-images' and (select public.is_store_owner()));
create policy "Owner updates product images" on storage.objects
for update to authenticated using (bucket_id = 'product-images' and (select public.is_store_owner()))
with check (bucket_id = 'product-images' and (select public.is_store_owner()));
create policy "Owner deletes product images" on storage.objects
for delete to authenticated using (bucket_id = 'product-images' and (select public.is_store_owner()));

-- Safe, read-only checkout flags for the public checkout page.
create or replace function public.get_public_checkout_settings()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'checkout_enabled', checkout_enabled,
    'pickup_enabled', pickup_enabled,
    'delivery_enabled', delivery_enabled,
    'delivery_fee_pkr', delivery_fee_pkr,
    'cash_on_delivery_enabled', cash_on_delivery_enabled,
    'bank_transfer_enabled', bank_transfer_enabled,
    'cash_at_pickup_enabled', cash_at_pickup_enabled
  )
  from public.store_settings where singleton = true;
$$;
revoke all on function public.get_public_checkout_settings() from public;
grant execute on function public.get_public_checkout_settings() to anon, authenticated;
