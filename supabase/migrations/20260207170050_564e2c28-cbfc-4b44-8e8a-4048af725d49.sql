
-- Add public sharing columns to collections
ALTER TABLE public.collections
ADD COLUMN is_public boolean NOT NULL DEFAULT false,
ADD COLUMN public_slug text UNIQUE;

-- Add sort_order column to prompts for drag-and-drop ordering
ALTER TABLE public.prompts
ADD COLUMN sort_order integer;

-- Create function to generate collection slugs (similar to generate_prompt_slug)
CREATE OR REPLACE FUNCTION public.generate_collection_slug()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_slug text;
  slug_exists boolean;
BEGIN
  LOOP
    new_slug := substring(md5(random()::text || clock_timestamp()::text) from 1 for 12);
    SELECT EXISTS(
      SELECT 1 FROM public.collections WHERE public_slug = new_slug
    ) INTO slug_exists;
    EXIT WHEN NOT slug_exists;
  END LOOP;
  RETURN new_slug;
END;
$$;

-- RLS: Allow anyone to read public collections
CREATE POLICY "Anyone can view public collections"
ON public.collections
FOR SELECT
USING (is_public = true);

-- RLS: Allow anyone to read prompts belonging to public collections
CREATE POLICY "Anyone can view prompts in public collections"
ON public.prompts
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.collections
    WHERE collections.id = prompts.collection_id
    AND collections.is_public = true
  )
);
