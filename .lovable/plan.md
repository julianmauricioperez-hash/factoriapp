
## Adjuntar archivos, imagenes y audio en el Chat IA

Se implementara la capacidad de adjuntar **imagenes**, **documentos** y **grabar audio** directamente en el chat, para que la IA pueda analizar el contenido visual o transcribir el audio.

---

### Que podra hacer el usuario

1. **Adjuntar imagenes** (JPG, PNG, WEBP, GIF) - La IA las analiza usando modelos con vision (Gemini)
2. **Adjuntar documentos** (PDF, TXT, MD) - Se extrae el texto y se envia como contexto al chat
3. **Grabar audio** con el microfono del dispositivo - Se convierte a texto (transcripcion) y se envia como mensaje

---

### Resumen de cambios

#### 1. Almacenamiento de archivos
Se creara un bucket de almacenamiento llamado `chat-attachments` para guardar las imagenes y audios subidos, con politicas de seguridad para que cada usuario solo acceda a sus propios archivos.

#### 2. Tabla de adjuntos
Se agregara una nueva tabla `chat_attachments` que vincula archivos con mensajes del chat, guardando el tipo de archivo, nombre y URL publica.

#### 3. Transcripcion de audio (funcion backend)
Se creara una funcion backend `transcribe-audio` que recibe el audio grabado y usa un modelo de IA para transcribirlo a texto.

#### 4. Interfaz del chat mejorada
- **Barra de entrada**: Se agregaran 3 botones nuevos junto al campo de texto:
  - Boton de **clip** (adjuntar imagen/documento)
  - Boton de **microfono** (grabar audio)
- **Vista previa**: Antes de enviar, el usuario vera una miniatura de la imagen o el nombre del archivo adjunto, con opcion de eliminar
- **Mensajes**: Los mensajes con imagenes mostraran la imagen inline; los de audio mostraran un indicador de "transcrito desde audio"

#### 5. Logica de envio multimodal
- Para **imagenes**: Se sube la imagen al almacenamiento, se obtiene la URL publica y se envia al modelo de IA como contenido multimodal (texto + imagen)
- Para **documentos**: Se lee el contenido del archivo en el navegador y se agrega como texto al mensaje
- Para **audio**: Se graba con la API `MediaRecorder` del navegador, se envia a la funcion de transcripcion, y el texto resultante se envia como mensaje normal

---

### Detalles tecnicos

**Base de datos - Migracion SQL:**
- Crear bucket `chat-attachments` (publico para servir imagenes en el chat)
- Crear tabla `chat_attachments` con columnas: `id`, `message_id` (FK a `chat_messages`), `file_type` (image/document/audio), `file_name`, `file_url`, `created_at`
- Politicas RLS en el bucket: los usuarios autenticados pueden subir a su propia carpeta (`user_id/`) y leer archivos publicos
- Politicas RLS en la tabla: lectura/escritura limitada al propietario de la conversacion

**Nueva funcion backend: `transcribe-audio`**
- Recibe audio (base64 o archivo)
- Usa el modelo `google/gemini-2.5-flash` con instruccion de transcripcion
- Devuelve el texto transcrito

**Funcion backend existente: `chat` (modificacion)**
- Adaptar para aceptar mensajes con contenido multimodal (array de `content` con tipo `text` e `image_url`) segun el formato de la API de Lovable AI

**Archivos frontend a modificar/crear:**

| Archivo | Cambio |
|---|---|
| `src/components/chat/ChatInput.tsx` | Agregar botones de adjuntar y microfono, vista previa de archivos, logica de grabacion de audio |
| `src/components/chat/ChatMessages.tsx` | Renderizar imagenes inline en mensajes, indicador de audio transcrito |
| `src/pages/Chat.tsx` | Actualizar `handleSendMessage` para manejar adjuntos, subir archivos al almacenamiento, envio multimodal |
| `src/hooks/useChatConversations.ts` | Actualizar `addMessage` para soportar adjuntos, agregar funcion para guardar adjuntos |
| `src/components/chat/AttachmentPreview.tsx` | **Nuevo** - Componente de vista previa de archivos adjuntos antes de enviar |
| `src/components/chat/AudioRecorder.tsx` | **Nuevo** - Componente para grabar audio con el microfono |
| `supabase/functions/transcribe-audio/index.ts` | **Nuevo** - Funcion para transcribir audio a texto |
| `supabase/functions/chat/index.ts` | Modificar para soportar mensajes con imagenes (formato multimodal) |
