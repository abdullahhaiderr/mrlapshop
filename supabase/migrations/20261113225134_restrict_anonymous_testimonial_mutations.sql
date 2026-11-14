-- Tighten the testimonial table to least-privilege grants.
-- Revoke legacy/default broad grants, then grant only the operations needed by each role.
revoke all privileges on table public.customer_testimonials from anon, authenticated;

grant select on public.customer_testimonials to anon, authenticated;
grant insert (display_name, headline, review_text, rating, youtube_url, consent_to_publish)
  on public.customer_testimonials to anon, authenticated;
grant update, delete on public.customer_testimonials to authenticated;
