
-- Fix 1: Remove overly permissive prompt_likes SELECT policy, add restricted one
DROP POLICY IF EXISTS "Anyone can view likes" ON prompt_likes;

CREATE POLICY "Users can view their own likes"
ON prompt_likes FOR SELECT
USING (auth.uid() = user_id);

-- Create RPC for public like counts (no user_id exposed)
CREATE OR REPLACE FUNCTION public.get_prompt_like_counts(prompt_ids UUID[])
RETURNS TABLE(prompt_id UUID, like_count INTEGER)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT pl.prompt_id, COUNT(*)::INTEGER as like_count
  FROM prompt_likes pl
  WHERE pl.prompt_id = ANY(prompt_ids)
  GROUP BY pl.prompt_id;
$$;

-- Fix 2: Make chat-attachments bucket private
UPDATE storage.buckets SET public = false WHERE id = 'chat-attachments';

-- Remove public SELECT policy on storage
DROP POLICY IF EXISTS "Chat attachments are publicly accessible" ON storage.objects;

-- Add user-scoped SELECT policy
CREATE POLICY "Users can view their own chat attachments"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'chat-attachments'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
