-- Create tags table
CREATE TABLE public.tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(name, user_id)
);

-- Create junction table for prompt-tag relationships
CREATE TABLE public.prompt_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prompt_id UUID NOT NULL REFERENCES public.prompts(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(prompt_id, tag_id)
);

-- Enable RLS on tags
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

-- Tags policies
CREATE POLICY "Users can view their own tags"
ON public.tags FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tags"
ON public.tags FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tags"
ON public.tags FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tags"
ON public.tags FOR DELETE
USING (auth.uid() = user_id);

-- Enable RLS on prompt_tags
ALTER TABLE public.prompt_tags ENABLE ROW LEVEL SECURITY;

-- Prompt tags policies (user can manage tags on their own prompts)
CREATE POLICY "Users can view tags on their prompts"
ON public.prompt_tags FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.prompts
  WHERE prompts.id = prompt_tags.prompt_id
  AND prompts.user_id = auth.uid()
));

CREATE POLICY "Users can add tags to their prompts"
ON public.prompt_tags FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.prompts
  WHERE prompts.id = prompt_tags.prompt_id
  AND prompts.user_id = auth.uid()
));

CREATE POLICY "Users can remove tags from their prompts"
ON public.prompt_tags FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.prompts
  WHERE prompts.id = prompt_tags.prompt_id
  AND prompts.user_id = auth.uid()
));

-- Create indexes for better performance
CREATE INDEX idx_tags_user_id ON public.tags(user_id);
CREATE INDEX idx_prompt_tags_prompt_id ON public.prompt_tags(prompt_id);
CREATE INDEX idx_prompt_tags_tag_id ON public.prompt_tags(tag_id);