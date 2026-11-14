-- Add covering indexes for the promotion-related foreign keys reported by Supabase's advisor.
-- These indexes improve joins and referenced-row maintenance without changing existing data.
create index if not exists orders_promo_code_id_idx
  on public.orders (promo_code_id);

create index if not exists promo_code_redemptions_user_id_idx
  on public.promo_code_redemptions (user_id);

create index if not exists promo_codes_created_by_idx
  on public.promo_codes (created_by);
