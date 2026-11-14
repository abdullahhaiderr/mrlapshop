-- Customer reviews and owner-moderated testimonials.
-- Public visitors may submit pending reviews; only the store owner can publish or reject them.

create table if not exists public.customer_testimonials (
  id uuid primary key default gen_random_uuid(),
  submitted_by uuid references auth.users(id) on delete set null default auth.uid(),
  display_name text not null check (char_length(display_name) between 2 and 80),
  headline text not null check (char_length(headline) between 3 and 120),
  review_text text check (review_text is null or char_length(review_text) between 20 and 1200),
  rating smallint check (rating is null or rating between 1 and 5),
  youtube_url text check (youtube_url is null or (char_length(youtube_url) <= 500 and youtube_url ~* '^https?://(www[.])?(youtube[.]com|youtu[.]be)/')),
  consent_to_publish boolean not null default false,
  status text not null default 'pending' check (status in ('pending', 'published', 'rejected')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint customer_testimonials_content_check check (review_text is not null or youtube_url is not null),
  constraint customer_testimonials_consent_check check (status <> 'published' or consent_to_publish),
  constraint customer_testimonials_published_at_check check (
    (status = 'published' and published_at is not null)
    or (status <> 'published' and published_at is null)
  )
);

comment on table public.customer_testimonials is
  'Customer-submitted reviews and optional YouTube testimonial videos. Public submissions remain pending until approved by the store owner.';

create index if not exists customer_testimonials_publication_idx
  on public.customer_testimonials(status, published_at desc)
  where status = 'published';
create index if not exists customer_testimonials_pending_idx
  on public.customer_testimonials(created_at desc)
  where status = 'pending';
create unique index if not exists customer_testimonials_youtube_url_unique_idx
  on public.customer_testimonials(youtube_url)
  where youtube_url is not null;

create trigger customer_testimonials_set_updated_at
  before update on public.customer_testimonials
  for each row execute function public.set_updated_at();

alter table public.customer_testimonials enable row level security;

grant select on public.customer_testimonials to anon, authenticated;
grant insert (display_name, headline, review_text, rating, youtube_url, consent_to_publish)
  on public.customer_testimonials to anon, authenticated;
grant update, delete on public.customer_testimonials to authenticated;

create policy "Anyone reads published customer testimonials"
  on public.customer_testimonials
  for select to anon, authenticated
  using (status = 'published');

create policy "Visitors submit pending customer testimonials"
  on public.customer_testimonials
  for insert to anon, authenticated
  with check (status = 'pending' and consent_to_publish = true);

create policy "Store owner manages all customer testimonials"
  on public.customer_testimonials
  for all to authenticated
  using ((select private.is_store_owner()))
  with check ((select private.is_store_owner()));

insert into public.customer_testimonials
  (display_name, headline, youtube_url, consent_to_publish, status, published_at)
values
  ('Mr LapShop customer', 'Customer video 01', 'https://www.youtube.com/shorts/W6DuRH8R5VY', true, 'published', now()),
  ('Mr LapShop customer', 'Customer video 02', 'https://www.youtube.com/shorts/pJD_msTOEm0', true, 'published', now()),
  ('Mr LapShop customer', 'Customer video 03', 'https://www.youtube.com/shorts/Hc4XS4sdFB0', true, 'published', now()),
  ('Mr LapShop customer', 'Customer video 04', 'https://www.youtube.com/shorts/6b28CkpNRJI', true, 'published', now())
on conflict (youtube_url) where youtube_url is not null do nothing;
