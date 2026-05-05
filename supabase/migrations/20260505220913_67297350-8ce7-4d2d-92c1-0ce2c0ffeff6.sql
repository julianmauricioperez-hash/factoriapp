DROP FUNCTION IF EXISTS public.admin_list_users_with_stats();

CREATE OR REPLACE FUNCTION public.admin_list_users_with_stats()
 RETURNS TABLE(id uuid, email text, created_at timestamp with time zone, last_sign_in_at timestamp with time zone, prompt_count bigint, public_prompt_count bigint, collection_count bigint, conversation_count bigint, is_admin boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    COALESCE((SELECT COUNT(*) FROM public.chat_conversations cc WHERE cc.user_id = u.id), 0) AS conversation_count,
    EXISTS(SELECT 1 FROM public.user_roles ur WHERE ur.user_id = u.id AND ur.role = 'admin'::app_role) AS is_admin
  FROM auth.users u
  ORDER BY u.created_at DESC;
END;
$function$;