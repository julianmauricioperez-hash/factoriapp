-- Add user_id column to prompts table
ALTER TABLE public.prompts 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can insert prompts" ON public.prompts;
DROP POLICY IF EXISTS "Anyone can read prompts" ON public.prompts;

-- Create new policies for authenticated users
CREATE POLICY "Users can insert their own prompts" 
ON public.prompts 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own prompts" 
ON public.prompts 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own prompts" 
ON public.prompts 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own prompts" 
ON public.prompts 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);