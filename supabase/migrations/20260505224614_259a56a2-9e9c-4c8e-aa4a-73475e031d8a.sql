
-- Admin-only RPCs: revoke from public/anon, grant to authenticated (internal has_role check enforces admin)
REVOKE ALL ON FUNCTION public.admin_recent_activity() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_recent_activity() TO authenticated;

REVOKE ALL ON FUNCTION public.admin_list_users_with_stats() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_users_with_stats() TO authenticated;

REVOKE ALL ON FUNCTION public.admin_list_users() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_users() TO authenticated;

-- has_role: only authenticated users
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

-- Slug generators: only authenticated (they already require auth.uid())
REVOKE ALL ON FUNCTION public.generate_collection_slug() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.generate_collection_slug() TO authenticated;

REVOKE ALL ON FUNCTION public.generate_prompt_slug() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.generate_prompt_slug() TO authenticated;

-- Trigger-only functions: not exposed to API roles at all
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

-- get_prompt_like_counts is intentionally public (used by public library for unauthenticated visitors)
-- Keep default PUBLIC EXECUTE.
