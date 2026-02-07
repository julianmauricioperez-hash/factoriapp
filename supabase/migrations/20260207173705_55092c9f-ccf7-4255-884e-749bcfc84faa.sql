
-- Create storage bucket for chat attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-attachments', 'chat-attachments', true);

-- Storage policies: authenticated users can upload to their own folder
CREATE POLICY "Users can upload their own chat attachments"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'chat-attachments' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Anyone can view chat attachments (bucket is public for inline images)
CREATE POLICY "Chat attachments are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'chat-attachments');

-- Users can delete their own chat attachments
CREATE POLICY "Users can delete their own chat attachments"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'chat-attachments' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create chat_attachments table
CREATE TABLE public.chat_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  file_type TEXT NOT NULL CHECK (file_type IN ('image', 'document', 'audio')),
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chat_attachments ENABLE ROW LEVEL SECURITY;

-- RLS: Users can view attachments of their conversations
CREATE POLICY "Users can view attachments of their conversations"
ON public.chat_attachments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM chat_messages cm
    JOIN chat_conversations cc ON cc.id = cm.conversation_id
    WHERE cm.id = chat_attachments.message_id
    AND cc.user_id = auth.uid()
  )
);

-- RLS: Users can insert attachments to their conversations
CREATE POLICY "Users can insert attachments to their conversations"
ON public.chat_attachments
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM chat_messages cm
    JOIN chat_conversations cc ON cc.id = cm.conversation_id
    WHERE cm.id = chat_attachments.message_id
    AND cc.user_id = auth.uid()
  )
);

-- RLS: Users can delete attachments of their conversations
CREATE POLICY "Users can delete attachments of their conversations"
ON public.chat_attachments
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM chat_messages cm
    JOIN chat_conversations cc ON cc.id = cm.conversation_id
    WHERE cm.id = chat_attachments.message_id
    AND cc.user_id = auth.uid()
  )
);
