-- Create collections table
CREATE TABLE public.collections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, name)
);

-- Enable RLS
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

-- RLS policies for collections
CREATE POLICY "Users can view their own collections"
ON public.collections FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own collections"
ON public.collections FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own collections"
ON public.collections FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own collections"
ON public.collections FOR DELETE
USING (auth.uid() = user_id);

-- Add collection_id to prompts table
ALTER TABLE public.prompts 
ADD COLUMN collection_id UUID REFERENCES public.collections(id) ON DELETE SET NULL;