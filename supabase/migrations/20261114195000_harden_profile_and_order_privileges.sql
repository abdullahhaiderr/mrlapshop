-- Keep customer profile identity and email-verification fields under Supabase Auth control.
-- RLS still scopes rows; these grants additionally limit which columns and operations the API can perform.
begin;

revoke all privileges on table public.profiles from anon, authenticated;
grant select on table public.profiles to authenticated;
grant update (full_name, phone, marketing_opt_in, marketing_opt_in_at)
  on table public.profiles to authenticated;

-- Admin membership is provisioned through trusted database administration only.
revoke all privileges on table public.admin_users from anon, authenticated;
grant select on table public.admin_users to authenticated;

-- Orders are created atomically by the SECURITY DEFINER place_order RPC.
-- Customers read their own rows; only the owner may update operational order fields through RLS.
revoke all privileges on table public.orders from anon, authenticated;
grant select on table public.orders to authenticated;
grant update (status, payment_status, delivery_fee_pkr, delivery_fee_pending, total_pkr)
  on table public.orders to authenticated;

-- Order items are written only by place_order and are otherwise read-only to API users.
revoke all privileges on table public.order_items from anon, authenticated;
grant select on table public.order_items to authenticated;

-- Store settings are read/changed through owner-protected RLS; grant only the fields used by the owner settings form.
revoke all privileges on table public.store_settings from anon, authenticated;
grant select on table public.store_settings to authenticated;
grant update (
  checkout_enabled,
  pickup_enabled,
  delivery_enabled,
  delivery_fee_pkr,
  jazzcash_enabled,
  easypaisa_enabled,
  ubl_bank_enabled,
  updated_by,
  updated_at
) on table public.store_settings to authenticated;

-- Assert that the customer-facing API cannot rewrite auth identity or grant itself order/admin writes.
do $assert$
begin
  if has_column_privilege('authenticated', 'public.profiles', 'email', 'UPDATE')
     or has_column_privilege('authenticated', 'public.profiles', 'email_verified', 'UPDATE')
     or has_column_privilege('authenticated', 'public.profiles', 'id', 'UPDATE') then
    raise exception 'Authenticated users must not update profile identity or email-verification columns';
  end if;

  if not has_column_privilege('authenticated', 'public.profiles', 'marketing_opt_in', 'UPDATE')
     or not has_column_privilege('authenticated', 'public.profiles', 'full_name', 'UPDATE')
     or not has_column_privilege('authenticated', 'public.profiles', 'phone', 'UPDATE') then
    raise exception 'Expected customer-editable profile columns are not granted';
  end if;

  if has_table_privilege('authenticated', 'public.admin_users', 'INSERT')
     or has_table_privilege('authenticated', 'public.admin_users', 'UPDATE')
     or has_table_privilege('authenticated', 'public.admin_users', 'DELETE')
     or has_table_privilege('authenticated', 'public.admin_users', 'TRUNCATE') then
    raise exception 'Authenticated users must not mutate admin membership';
  end if;

  if has_table_privilege('authenticated', 'public.orders', 'INSERT')
     or has_table_privilege('authenticated', 'public.orders', 'DELETE')
     or has_table_privilege('authenticated', 'public.orders', 'TRUNCATE') then
    raise exception 'Orders must be created only through the trusted order RPC and must not be deleted by API users';
  end if;

  if not has_column_privilege('authenticated', 'public.orders', 'delivery_fee_pkr', 'UPDATE')
     or not has_column_privilege('authenticated', 'public.orders', 'delivery_fee_pending', 'UPDATE')
     or not has_column_privilege('authenticated', 'public.orders', 'total_pkr', 'UPDATE') then
    raise exception 'Owner order management is missing required delivery/total update grants';
  end if;

  if has_table_privilege('authenticated', 'public.order_items', 'INSERT')
     or has_table_privilege('authenticated', 'public.order_items', 'UPDATE')
     or has_table_privilege('authenticated', 'public.order_items', 'DELETE')
     or has_table_privilege('authenticated', 'public.order_items', 'TRUNCATE') then
    raise exception 'Order item writes must remain inside the trusted order RPC';
  end if;
end;
$assert$;

commit;
