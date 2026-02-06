-- Create chat_tags junction table
CREATE TABLE public.chat_tags (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id uuid NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(conversation_id, tag_id)
);

-- Enable RLS
ALTER TABLE public.chat_tags ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view tags on their conversations"
ON public.chat_tags FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.chat_conversations
    WHERE chat_conversations.id = chat_tags.conversation_id
    AND chat_conversations.user_id = auth.uid()
  )
);

CREATE POLICY "Users can add tags to their conversations"
ON public.chat_tags FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.chat_conversations
    WHERE chat_conversations.id = chat_tags.conversation_id
    AND chat_conversations.user_id = auth.uid()
  )
);

CREATE POLICY "Users can remove tags from their conversations"
ON public.chat_tags FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.chat_conversations
    WHERE chat_conversations.id = chat_tags.conversation_id
    AND chat_conversations.user_id = auth.uid()
  )
);

-- Index for performance
CREATE INDEX idx_chat_tags_conversation_id ON public.chat_tags(conversation_id);
CREATE INDEX idx_chat_tags_tag_id ON public.chat_tags(tag_id);