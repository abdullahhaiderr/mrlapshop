-- Reconcile the public/owner permissions and indexes for customer testimonials.
-- This migration is intentionally safe to run against an existing table: the table,
-- policies and indexes are created only when needed, and policies are normalized
-- to one public-read rule plus explicitly owner-restricted moderation rules.

create table if not exists public.customer_testimonials (
  id uuid primary key default gen_random_uuid(),
  submitted_by uuid references auth.users(id) on delete set null default auth.uid(),
  display_name text not null,
  headline text not null,
  review_text text,
  rating smallint,
  youtube_url text,
  consent_to_publish boolean not null default false,
  status text not null default 'pending',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint customer_testimonials_display_name_check check (char_length(display_name) between 2 and 80),
  constraint customer_testimonials_headline_check check (char_length(headline) between 3 and 120),
  constraint customer_testimonials_review_text_check check (review_text is null or char_length(review_text) between 20 and 1200),
  constraint customer_testimonials_rating_check check (rating is null or rating between 1 and 5),
  constraint customer_testimonials_youtube_url_check check (youtube_url is null or (char_length(youtube_url) <= 500 and youtube_url ~* '^https?://(www[.])?(youtube[.]com|youtu[.]be)/')),
  constraint customer_testimonials_status_check check (status in ('pending', 'published', 'rejected')),
  constraint customer_testimonials_content_check check (review_text is not null or youtube_url is not null),
  constraint customer_testimonials_consent_check check (status <> 'published' or consent_to_publish),
  constraint customer_testimonials_published_at_check check (
    (status = 'published' and published_at is not null)
    or (status <> 'published' and published_at is null)
  )
);

alter table public.customer_testimonials enable row level security;

create index if not exists customer_testimonials_pending_idx
  on public.customer_testimonials (created_at desc) where status = 'pending';
create index if not exists customer_testimonials_publication_idx
  on public.customer_testimonials (status, published_at desc) where status = 'published';
create unique index if not exists customer_testimonials_youtube_url_unique_idx
  on public.customer_testimonials (youtube_url) where youtube_url is not null;
create index if not exists customer_testimonials_submitted_by_idx
  on public.customer_testimonials (submitted_by);

-- Anon visitors may only read public, consented testimonials. Signed-in customers
-- may submit consented pending reviews. Owner-only RLS rules control publication
-- and moderation. Authenticated INSERT is required for the owner dashboard.
revoke all on table public.customer_testimonials from public;
revoke insert, update, delete on table public.customer_testimonials from anon;
grant select on table public.customer_testimonials to anon;
grant select, insert, update, delete on table public.customer_testimonials to authenticated;

drop policy if exists "Anyone reads published customer testimonials" on public.customer_testimonials;
drop policy if exists "Authenticated reads published or owner testimonials" on public.customer_testimonials;
drop policy if exists "Authenticated submit pending or owner testimonials" on public.customer_testimonials;
drop policy if exists "Store owners delete testimonials" on public.customer_testimonials;
drop policy if exists "Store owners update testimonials" on public.customer_testimonials;
drop policy if exists "Visitors submit pending customer testimonials" on public.customer_testimonials;
drop policy if exists "Read published or owner testimonials" on public.customer_testimonials;
drop policy if exists "Submit pending or owner testimonials" on public.customer_testimonials;

create policy "Read published or owner testimonials"
  on public.customer_testimonials for select to anon, authenticated
  using (
    (status = 'published' and consent_to_publish = true)
    or (select private.is_store_owner())
  );

create policy "Submit pending or owner testimonials"
  on public.customer_testimonials for insert to authenticated
  with check (
    (status = 'pending' and consent_to_publish = true)
    or (select private.is_store_owner())
  );

create policy "Store owners update testimonials"
  on public.customer_testimonials for update to authenticated
  using ((select private.is_store_owner()))
  with check ((select private.is_store_owner()));

create policy "Store owners delete testimonials"
  on public.customer_testimonials for delete to authenticated
  using ((select private.is_store_owner()));

comment on table public.customer_testimonials is
  'Customer-written and YouTube video testimonials. Public read access is limited to consented published records; all moderation is owner controlled.';
