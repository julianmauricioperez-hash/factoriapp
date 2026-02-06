-- Fix slug generation: avoid gen_random_bytes() dependency
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
  LOOP
    -- 12 hex chars; uses built-in functions only
    new_slug := substring(md5(random()::text || clock_timestamp()::text) from 1 for 12);

    SELECT EXISTS(
      SELECT 1
      FROM public.prompts
      WHERE public_slug = new_slug
    ) INTO slug_exists;

    EXIT WHEN NOT slug_exists;
  END LOOP;

  RETURN new_slug;
END;
$$;

-- Ensure share links are unique when present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'i'
      AND c.relname = 'prompts_public_slug_unique'
      AND n.nspname = 'public'
  ) THEN
    CREATE UNIQUE INDEX prompts_public_slug_unique
      ON public.prompts (public_slug)
      WHERE public_slug IS NOT NULL;
  END IF;
END;
$$;