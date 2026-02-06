-- Allow authenticated users to generate public slugs for their prompts
GRANT EXECUTE ON FUNCTION public.generate_prompt_slug() TO authenticated;