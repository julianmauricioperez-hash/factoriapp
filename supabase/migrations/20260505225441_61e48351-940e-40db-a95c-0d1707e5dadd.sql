
-- 1. user_roles: políticas explícitas (solo admins gestionan roles)
CREATE POLICY "Admins can insert roles"
ON public.user_roles FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles"
ON public.user_roles FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
ON public.user_roles FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 2. prompt_likes: solo permitir like en prompts públicos o propios
DROP POLICY IF EXISTS "Users can like prompts" ON public.prompt_likes;

CREATE POLICY "Users can like accessible prompts"
ON public.prompt_likes FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.prompts p
    WHERE p.id = prompt_id
      AND (p.is_public = true OR p.user_id = auth.uid())
  )
);

-- 3. storage chat-attachments: política UPDATE limitada al dueño
CREATE POLICY "Users can update their own chat attachments"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'chat-attachments' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'chat-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);
