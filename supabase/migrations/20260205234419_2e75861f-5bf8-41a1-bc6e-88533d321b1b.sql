-- Fix search_path for the function
CREATE OR REPLACE FUNCTION public.generate_prompt_slug()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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