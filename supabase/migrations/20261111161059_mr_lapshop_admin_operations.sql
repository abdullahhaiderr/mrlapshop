-- Mr LapShop Version 1.6: owner operations and fulfilment controls.
-- Apply AFTER 20261111161040_mr_lapshop_initial_store_schema.sql.

alter type public.order_status add value if not exists 'ready_for_pickup';
alter type public.order_status add value if not exists 'return_requested';
alter type public.order_status add value if not exists 'returned';
alter type public.order_status add value if not exists 'refunded';

create table if not exists public.order_fulfilment_checks (
  order_id uuid primary key references public.orders(id) on delete cascade,
  os_installed boolean not null default false,
  drivers_installed boolean not null default false,
  updates_run boolean not null default false,
  requested_apps_installed boolean not null default false,
  final_test_completed boolean not null default false,
  internal_note text,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  constraint order_fulfilment_note_length check (internal_note is null or length(internal_note) <= 2000)
);

create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null check (length(action) between 3 and 100),
  entity_type text not null check (length(entity_type) between 2 and 50),
  entity_id text not null check (length(entity_id) between 1 and 120),
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists admin_audit_log_created_idx on public.admin_audit_log(created_at desc);
create index if not exists admin_audit_log_entity_idx on public.admin_audit_log(entity_type, entity_id);

alter table public.order_fulfilment_checks enable row level security;
alter table public.admin_audit_log enable row level security;

grant select, insert, update on public.order_fulfilment_checks to authenticated;
revoke update, delete on public.admin_audit_log from anon, authenticated;
grant select, insert on public.admin_audit_log to authenticated;

-- Owner application actions may update only operational order states, not customer identity or money snapshots.
revoke update on public.orders from authenticated;
grant update (status, payment_status) on public.orders to authenticated;

create policy "Owner manages order fulfilment checks" on public.order_fulfilment_checks
for all to authenticated using ((select public.is_store_owner()))
with check ((select public.is_store_owner()));

create policy "Owner reads audit log" on public.admin_audit_log
for select to authenticated using ((select public.is_store_owner()));

create policy "Owner inserts audit log" on public.admin_audit_log
for insert to authenticated with check (
  (select public.is_store_owner()) and actor_id = (select auth.uid())
);

-- Clients must not mutate fulfilment and audit records directly; only owner sessions with RLS can.
comment on table public.order_fulfilment_checks is 'Private owner checklist for OS, drivers, updates, requested apps and final device test.';
comment on table public.admin_audit_log is 'Append-only owner activity history. No public/customer read access.';
