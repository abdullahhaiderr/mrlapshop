-- Give authenticated owners the two moderation columns needed to insert approved records.
-- Anonymous visitors continue to receive only pending-submit column permissions.
grant insert (status, published_at) on public.customer_testimonials to authenticated;

-- Cover the submitted_by foreign key for efficient owner filtering and deletes.
create index if not exists customer_testimonials_submitted_by_idx
  on public.customer_testimonials(submitted_by);

-- Separate policies by role and operation to remove overlapping permissive policies
-- while preserving public reads, pending submissions, and full owner moderation.
drop policy if exists "Store owner manages all customer testimonials" on public.customer_testimonials;
drop policy if exists "Visitors submit pending customer testimonials" on public.customer_testimonials;
drop policy if exists "Anyone reads published customer testimonials" on public.customer_testimonials;

create policy "Anyone reads published customer testimonials"
  on public.customer_testimonials
  for select to anon
  using (status = 'published');

create policy "Authenticated reads published or owner testimonials"
  on public.customer_testimonials
  for select to authenticated
  using (status = 'published' or (select private.is_store_owner()));

create policy "Visitors submit pending customer testimonials"
  on public.customer_testimonials
  for insert to anon
  with check (status = 'pending' and consent_to_publish = true);

create policy "Authenticated submit pending or owner testimonials"
  on public.customer_testimonials
  for insert to authenticated
  with check (
    (status = 'pending' and consent_to_publish = true)
    or (select private.is_store_owner())
  );

create policy "Store owners update testimonials"
  on public.customer_testimonials
  for update to authenticated
  using ((select private.is_store_owner()))
  with check ((select private.is_store_owner()));

create policy "Store owners delete testimonials"
  on public.customer_testimonials
  for delete to authenticated
  using ((select private.is_store_owner()));
