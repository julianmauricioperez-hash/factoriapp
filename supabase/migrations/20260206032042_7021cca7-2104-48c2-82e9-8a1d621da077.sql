-- Create table for prompt likes
CREATE TABLE public.prompt_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id uuid NOT NULL REFERENCES public.prompts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (prompt_id, user_id)
);

-- Enable RLS
ALTER TABLE public.prompt_likes ENABLE ROW LEVEL SECURITY;

-- Users can view all likes (for counting)
CREATE POLICY "Anyone can view likes"
ON public.prompt_likes
FOR SELECT
USING (true);

-- Users can insert their own likes
CREATE POLICY "Users can like prompts"
ON public.prompt_likes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own likes
CREATE POLICY "Users can unlike prompts"
ON public.prompt_likes
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster counting
CREATE INDEX idx_prompt_likes_prompt_id ON public.prompt_likes(prompt_id);