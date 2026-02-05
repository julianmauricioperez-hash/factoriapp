-- Add public sharing columns to prompts
ALTER TABLE public.prompts
ADD COLUMN is_public boolean NOT NULL DEFAULT false,
ADD COLUMN public_slug text UNIQUE;

-- Create index for public slug lookups
CREATE INDEX idx_prompts_public_slug ON public.prompts(public_slug) WHERE public_slug IS NOT NULL;

-- Create index for public prompts
CREATE INDEX idx_prompts_is_public ON public.prompts(is_public) WHERE is_public = true;

-- RLS policy for viewing public prompts (anyone can view)
CREATE POLICY "Anyone can view public prompts"
ON public.prompts
FOR SELECT
USING (is_public = true);

-- Function to generate unique slug
CREATE OR REPLACE FUNCTION public.generate_prompt_slug()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  new_slug text;
  slug_exists boolean;
BEGIN
  LOOP
    new_slug := encode(gen_random_bytes(6), 'hex');
    SELECT EXISTS(SELECT 1 FROM public.prompts WHERE public_slug = new_slug) INTO slug_exists;
    EXIT WHEN NOT slug_exists;
  END LOOP;
  RETURN new_slug;
END;
$$;