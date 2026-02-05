-- Create table for storing prompts
CREATE TABLE public.prompts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    category TEXT NOT NULL,
    prompt_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert prompts (public form)
CREATE POLICY "Anyone can insert prompts" 
ON public.prompts 
FOR INSERT 
WITH CHECK (true);

-- Allow anyone to read prompts
CREATE POLICY "Anyone can read prompts" 
ON public.prompts 
FOR SELECT 
USING (true);