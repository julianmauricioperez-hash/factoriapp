-- Add has_search_messages column to track conversations with search mode messages
ALTER TABLE public.chat_conversations 
ADD COLUMN has_search_messages boolean NOT NULL DEFAULT false;