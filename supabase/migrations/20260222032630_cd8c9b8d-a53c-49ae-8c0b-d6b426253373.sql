
CREATE OR REPLACE FUNCTION public.admin_list_users_with_stats()
RETURNS TABLE (
  id uuid,
  email text,
  created_at timestamp with time zone,
  last_sign_in_at timestamp with time zone,
  prompt_count bigint,
  public_prompt_count bigint,
  collection_count bigint,
  conversation_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  
  RETURN QUERY
  SELECT 
    u.id,
    u.email::text,
    u.created_at,
    u.last_sign_in_at,
    COALESCE((SELECT COUNT(*) FROM public.prompts p WHERE p.user_id = u.id), 0) AS prompt_count,
    COALESCE((SELECT COUNT(*) FROM public.prompts p WHERE p.user_id = u.id AND p.is_public = true), 0) AS public_prompt_count,
    COALESCE((SELECT COUNT(*) FROM public.collections c WHERE c.user_id = u.id), 0) AS collection_count,
    COALESCE((SELECT COUNT(*) FROM public.chat_conversations cc WHERE cc.user_id = u.id), 0) AS conversation_count
  FROM auth.users u
  ORDER BY u.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_recent_activity()
RETURNS TABLE (
  prompt_id uuid,
  prompt_text text,
  category text,
  created_at timestamp with time zone,
  user_email text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  
  RETURN QUERY
  SELECT 
    p.id,
    LEFT(p.prompt_text, 120) AS prompt_text,
    p.category,
    p.created_at,
    u.email::text
  FROM public.prompts p
  JOIN auth.users u ON u.id = p.user_id
  ORDER BY p.created_at DESC
  LIMIT 20;
END;
$$;
