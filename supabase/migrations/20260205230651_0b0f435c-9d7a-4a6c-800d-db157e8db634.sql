-- Add is_favorite column to prompts table
ALTER TABLE public.prompts 
ADD COLUMN is_favorite BOOLEAN NOT NULL DEFAULT false;