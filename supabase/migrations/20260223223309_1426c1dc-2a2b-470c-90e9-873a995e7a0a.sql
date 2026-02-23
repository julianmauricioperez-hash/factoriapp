
-- Add authentication check to generate_prompt_slug
CREATE OR REPLACE FUNCTION public.generate_prompt_slug()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  new_slug text;
  slug_exists boolean;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  LOOP
    new_slug := substring(md5(random()::text || clock_timestamp()::text) from 1 for 12);
    SELECT EXISTS(
      SELECT 1 FROM public.prompts WHERE public_slug = new_slug
    ) INTO slug_exists;
    EXIT WHEN NOT slug_exists;
  END LOOP;
  RETURN new_slug;
END;
$$;

-- Add authentication check to generate_collection_slug
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
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

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
