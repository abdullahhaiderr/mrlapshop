-- Run manually in the Supabase SQL Editor after the owner's email has been
-- registered and email-verified. Replace the email placeholder first.
-- This is intentionally not part of an automatic migration.

insert into public.admin_users (user_id, role)
select id, 'owner'
from auth.users
where lower(email) = lower('OWNER_EMAIL_HERE')
on conflict (user_id) do nothing;

-- Confirm exactly one owner record exists.
select au.user_id, u.email, au.role, au.created_at
from public.admin_users au
join auth.users u on u.id = au.user_id;
