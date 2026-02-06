-- Add color column to collections table
ALTER TABLE public.collections 
ADD COLUMN color TEXT DEFAULT 'slate';

-- Add a comment explaining valid colors
COMMENT ON COLUMN public.collections.color IS 'Color theme for the collection: slate, red, orange, amber, yellow, lime, green, emerald, teal, cyan, sky, blue, indigo, violet, purple, fuchsia, pink, rose';