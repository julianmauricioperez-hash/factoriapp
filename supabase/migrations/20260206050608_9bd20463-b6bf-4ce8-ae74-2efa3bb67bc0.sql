-- Add is_favorite column to chat_conversations
ALTER TABLE public.chat_conversations
ADD COLUMN is_favorite boolean NOT NULL DEFAULT false;