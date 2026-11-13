-- Mr LapShop database hardening after initial schema + admin operations.
-- Keep the owner-check helper outside the exposed public API schema.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated;

create or replace function private.is_store_owner()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = (select auth.uid())
      and role = 'owner'
  );
$$;
revoke all on function private.is_store_owner() from public;
grant execute on function private.is_store_owner() to anon, authenticated;

-- Consolidated profile visibility: a customer sees their own record; owner sees customers.
drop policy if exists "Customers can read their own profile" on public.profiles;
drop policy if exists "Owner can read customer profiles" on public.profiles;
create policy "Read own profile or owner reads customers" on public.profiles
for select to authenticated
using ((select auth.uid()) = id or (select private.is_store_owner()));

-- Categories: public active reads, owner-only writes.
drop policy if exists "Anyone can read active categories" on public.categories;
drop policy if exists "Owner manages categories" on public.categories;
create policy "Read active categories or owner catalogue" on public.categories
for select to anon, authenticated
using (is_active = true or (select private.is_store_owner()));
create policy "Owner inserts categories" on public.categories
for insert to authenticated with check ((select private.is_store_owner()));
create policy "Owner updates categories" on public.categories
for update to authenticated using ((select private.is_store_owner()))
with check ((select private.is_store_owner()));
create policy "Owner deletes categories" on public.categories
for delete to authenticated using ((select private.is_store_owner()));

-- Products: public active reads, owner-only writes.
drop policy if exists "Anyone can read active products" on public.products;
drop policy if exists "Owner manages products" on public.products;
create policy "Read active products or owner catalogue" on public.products
for select to anon, authenticated
using (status = 'active' or (select private.is_store_owner()));
create policy "Owner inserts products" on public.products
for insert to authenticated with check ((select private.is_store_owner()));
create policy "Owner updates products" on public.products
for update to authenticated using ((select private.is_store_owner()))
with check ((select private.is_store_owner()));
create policy "Owner deletes products" on public.products
for delete to authenticated using ((select private.is_store_owner()));

-- Product images: active-product image reads, owner-only writes.
drop policy if exists "Anyone can read images of active products" on public.product_images;
drop policy if exists "Owner manages product images" on public.product_images;
create policy "Read active product images or owner catalogue" on public.product_images
for select to anon, authenticated
using (
  exists (
    select 1 from public.products p
    where p.id = product_id and p.status = 'active'
  )
  or (select private.is_store_owner())
);
create policy "Owner inserts product images" on public.product_images
for insert to authenticated with check ((select private.is_store_owner()));
create policy "Owner updates product images" on public.product_images
for update to authenticated using ((select private.is_store_owner()))
with check ((select private.is_store_owner()));
create policy "Owner deletes product images" on public.product_images
for delete to authenticated using ((select private.is_store_owner()));

-- Orders and items remain private to the customer or owner.
drop policy if exists "Customers read their own orders" on public.orders;
create policy "Customers read own orders or owner reads all" on public.orders
for select to authenticated
using ((select auth.uid()) = user_id or (select private.is_store_owner()));
drop policy if exists "Owner updates orders" on public.orders;
create policy "Owner updates order status" on public.orders
for update to authenticated
using ((select private.is_store_owner()))
with check ((select private.is_store_owner()));

drop policy if exists "Customers and owner read order items" on public.order_items;
create policy "Customers read own order items or owner reads all" on public.order_items
for select to authenticated
using (
  (select private.is_store_owner())
  or exists (
    select 1 from public.orders o
    where o.id = order_id and o.user_id = (select auth.uid())
  )
);

-- Marketing subscriber list and store settings are owner-only.
drop policy if exists "Owner reads newsletter subscribers" on public.newsletter_subscriptions;
drop policy if exists "Owner manages newsletter subscribers" on public.newsletter_subscriptions;
create policy "Owner manages newsletter subscribers" on public.newsletter_subscriptions
for all to authenticated
using ((select private.is_store_owner()))
with check ((select private.is_store_owner()));

drop policy if exists "Owner reads store settings" on public.store_settings;
create policy "Owner reads store settings" on public.store_settings
for select to authenticated
using ((select private.is_store_owner()));
drop policy if exists "Owner updates store settings" on public.store_settings;
create policy "Owner updates store settings" on public.store_settings
for update to authenticated
using ((select private.is_store_owner()))
with check ((select private.is_store_owner()));

-- Owner-only fulfilment checklist and append-only activity history.
drop policy if exists "Owner manages order fulfilment checks" on public.order_fulfilment_checks;
create policy "Owner manages order fulfilment checks" on public.order_fulfilment_checks
for all to authenticated
using ((select private.is_store_owner()))
with check ((select private.is_store_owner()));
drop policy if exists "Owner reads audit log" on public.admin_audit_log;
create policy "Owner reads audit log" on public.admin_audit_log
for select to authenticated
using ((select private.is_store_owner()));
drop policy if exists "Owner inserts audit log" on public.admin_audit_log;
create policy "Owner inserts audit log" on public.admin_audit_log
for insert to authenticated
with check ((select private.is_store_owner()) and actor_id = (select auth.uid()));

-- Trigger-only SECURITY DEFINER functions are not public RPC endpoints.
revoke all on function public.handle_new_customer() from public, anon, authenticated;
revoke all on function public.sync_customer_email_verification() from public, anon, authenticated;

-- Product-image uploads, replacements and deletes are owner-only.
drop policy if exists "Owner uploads product images" on storage.objects;
create policy "Owner uploads product images" on storage.objects
for insert to authenticated
with check (bucket_id = 'product-images' and (select private.is_store_owner()));
drop policy if exists "Owner updates product images" on storage.objects;
create policy "Owner updates product images" on storage.objects
for update to authenticated
using (bucket_id = 'product-images' and (select private.is_store_owner()))
with check (bucket_id = 'product-images' and (select private.is_store_owner()));
drop policy if exists "Owner deletes product images" on storage.objects;
create policy "Owner deletes product images" on storage.objects
for delete to authenticated
using (bucket_id = 'product-images' and (select private.is_store_owner()));

-- Cover all foreign keys; these are useful once real orders/customers are present.
create index if not exists categories_parent_id_idx on public.categories(parent_id);
create index if not exists newsletter_subscriptions_user_id_idx on public.newsletter_subscriptions(user_id);
create index if not exists order_fulfilment_checks_updated_by_idx on public.order_fulfilment_checks(updated_by);
create index if not exists order_items_product_id_idx on public.order_items(product_id);
create index if not exists store_settings_updated_by_idx on public.store_settings(updated_by);
create index if not exists admin_audit_log_actor_id_idx on public.admin_audit_log(actor_id);

-- A customer may have at most one default address.
create unique index if not exists customer_addresses_one_default_per_user_idx
on public.customer_addresses(user_id) where is_default = true;

-- All policies now use the non-exposed helper.
drop function public.is_store_owner();
