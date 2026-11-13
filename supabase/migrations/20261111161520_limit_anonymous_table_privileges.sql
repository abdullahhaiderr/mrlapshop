-- Anonymous visitors can query only the public catalogue.
-- Guest checkout/tracking use narrowly scoped RPCs, not direct table access.
revoke all privileges on all tables in schema public from anon;
grant select on public.categories, public.products, public.product_images to anon;
revoke all privileges on all sequences in schema public from anon;

grant select on public.categories, public.products, public.product_images to anon, authenticated;
