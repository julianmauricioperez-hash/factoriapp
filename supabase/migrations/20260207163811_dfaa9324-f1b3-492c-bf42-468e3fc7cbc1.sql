
-- Allow anyone to read prompt_tags for public prompts
CREATE POLICY "Anyone can view tags of public prompts"
ON public.prompt_tags
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.prompts
    WHERE prompts.id = prompt_tags.prompt_id
    AND prompts.is_public = true
  )
);

-- Allow anyone to read tags that are associated with public prompts
CREATE POLICY "Anyone can view tags used in public prompts"
ON public.tags
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.prompt_tags
    JOIN public.prompts ON prompts.id = prompt_tags.prompt_id
    WHERE prompt_tags.tag_id = tags.id
    AND prompts.is_public = true
  )
);
