-- Restrict Supabase's automatically-installed SECURITY DEFINER event-trigger function.
-- It is invoked by PostgreSQL as an event trigger, not as an API function.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
