# Arquitectura de Factoría

Diagramas del sistema end-to-end, base de datos, autenticación y flujo de streaming en tiempo real.

## Sistema end-to-end

```text
┌──────────────────────────── NAVEGADOR (PWA) ────────────────────────────┐
│                                                                          │
│  React 18 + Vite + TypeScript + Tailwind + shadcn/ui                     │
│                                                                          │
│  Router (react-router-dom)                                               │
│    ├── Públicas:   /  /auth  /library  /p/:slug  /c/:slug  /install      │
│    ├── Privadas:   /my-prompts /collections /tags /chat /statistics      │
│    └── Admin:      /admin  (requiere rol app_role='admin')               │
│                                                                          │
│  Estado y datos                                                          │
│    ├── AuthProvider (src/hooks/useAuth.tsx) — sesión + onAuthStateChange │
│    ├── React Query — cache de lecturas                                   │
│    └── Hooks de dominio (usePrompts, useCollections, useTags, ...)       │
│                                                                          │
│  Service Worker (vite-plugin-pwa)                                        │
│    └── denylist: /~oauth  (no intercepta el redirect OAuth)              │
└───────────────┬─────────────────────────────────┬────────────────────────┘
                │ supabase-js (REST + Auth)       │ supabase.functions.invoke
                │ JWT del usuario                 │ Authorization: Bearer <JWT>
                ▼                                 ▼
┌────────────────────────────┐        ┌───────────────────────────────────┐
│  LOVABLE CLOUD — Data API  │        │  EDGE FUNCTIONS (Deno)            │
│  PostgREST + RLS           │        │   chat            (SSE streaming) │
│                            │        │   improve-prompt  (JSON)          │
│  Tablas: prompts,          │        │   transcribe-audio(JSON)          │
│  collections, categories,  │        │   admin-users     (JSON, admin)   │
│  tags, prompt_tags,        │        └───────┬───────────────────┬───────┘
│  prompt_likes, profiles,   │                │                   │
│  user_roles, chat_*        │                │ service_role      │
│                            │◄───────────────┘                   │
│  RPC SECURITY DEFINER      │                                    ▼
│   has_role, admin_*,       │                      ┌──────────────────────┐
│   get_prompt_like_counts   │                      │  Lovable AI Gateway  │
└────────────┬───────────────┘                      │  Gemini 3 / 2.5      │
             │                                      │  GPT-5 / 5.2 / mini  │
             ▼                                      └──────────────────────┘
┌────────────────────────────┐
│  AUTH        │  STORAGE    │
│  email+pass  │  bucket     │
│  Google OAuth│  chat-      │
│  reset pass  │  attachments│
│  HIBP check  │  (privado)  │
└────────────────────────────┘
```

## Base de datos

```text
                        auth.users (gestionado por la plataforma)
                              │ id
      ┌───────────────┬───────┼────────────┬──────────────┬───────────────┐
      ▼               ▼       ▼            ▼              ▼               ▼
 ┌──────────┐  ┌────────────┐ ┌──────────┐ ┌──────────┐ ┌────────────────────┐
 │ profiles │  │ user_roles │ │ prompts  │ │   tags   │ │ chat_conversations │
 ├──────────┤  ├────────────┤ ├──────────┤ ├──────────┤ ├────────────────────┤
 │ id (PK,  │  │ id         │ │ id       │ │ id       │ │ id                 │
 │  =user)  │  │ user_id    │ │ user_id  │ │ user_id  │ │ user_id            │
 │ has_     │  │ role       │ │ category │ │ name     │ │ title              │
 │ completed│  │ (app_role) │ │ prompt_  │ │ color    │ │ is_favorite        │
 │ _onboard.│  │ UNIQUE(    │ │  text    │ └────┬─────┘ │ has_search_messages│
 └──────────┘  │  user,role)│ │ is_fav   │      │       │ created/updated_at │
   ▲ trigger   └────────────┘ │ is_public│      │       └─────────┬──────────┘
   │ handle_                  │ public_  │      │                 │
   │ new_user()               │  slug    │      │                 ▼
                              │ sort_ord.│      │       ┌────────────────┐
                              │ collect. │      │       │ chat_messages  │
                              │  _id ────┼──┐   │       ├────────────────┤
                              └────┬─────┘  │   │       │ conversation_id│
                                   │        │   │       │ role           │
              ┌────────────────────┼────────┘   │       │ content        │
              ▼                    ▼            │       │ prompt_id ─────┼──► prompts
      ┌──────────────┐     ┌──────────────┐     │       └───────┬────────┘
      │ prompt_likes │     │ collections  │     │               │
      ├──────────────┤     ├──────────────┤     │               ▼
      │ prompt_id    │     │ id           │     │      ┌──────────────────┐
      │ user_id      │     │ user_id      │     │      │ chat_attachments │
      └──────────────┘     │ name / desc  │     │      ├──────────────────┤
                           │ color        │     │      │ message_id       │
      ┌──────────────┐     │ is_public    │     │      │ file_type / name │
      │ prompt_tags  │     │ public_slug  │     │      │ file_url         │
      ├──────────────┤     └──────────────┘     │      └──────────────────┘
      │ prompt_id ───┼──► prompts               │
      │ tag_id ──────┼──────────────────────────┘      ┌──────────────┐
      └──────────────┘                                 │  chat_tags   │
                                                       │ conv_id/tag_id│
      ┌──────────────┐                                 └──────────────┘
      │  categories  │  id, user_id, name
      └──────────────┘
```

### Seguridad y RLS

- **RLS activo en todas las tablas de `public`.** Patrón base: `auth.uid() = user_id`.
- **Excepciones públicas** (lectura sin sesión): `prompts` con `is_public = true`,
  `collections` con `is_public = true`, prompts dentro de colecciones públicas, y
  `tags` / `prompt_tags` asociados a prompts públicos.
- **Roles**: nunca en `profiles`. Viven en `user_roles` (enum `app_role`) y se consultan con la
  función `SECURITY DEFINER` `has_role(uuid, app_role)` para evitar recursión en las políticas.
- **`REVOKE EXECUTE ... FROM PUBLIC`** en todas las funciones `SECURITY DEFINER`.
  Solo `get_prompt_like_counts` es invocable por `anon` (biblioteca pública).
- **Storage**: el bucket `chat-attachments` es privado; los archivos se sirven con
  *signed URLs* de 1 hora generadas bajo demanda.

## Autenticación

```text
 A) Email + contraseña
 ─────────────────────
 Auth.tsx ──signUp/signInWithPassword──► Auth (HIBP check activo)
     │                                      │
     │◄──────── sesión + JWT ───────────────┘
     ▼
 AuthProvider guarda sesión (localStorage) y escucha onAuthStateChange
     │
     └─► trigger on_auth_user_created ─► handle_new_user() ─► INSERT profiles
             │
             └─ has_completed_onboarding = false ─► redirige a /onboarding

 B) Google OAuth
 ───────────────
 "Continuar con Google"
     └─► signInWithOAuth({ provider:'google', redirectTo: window.location.origin })
             └─► Google ──► /~oauth (EXCLUIDO del service worker) ──► origin
                     └─► sesión hidratada ──► navegación a la ruta destino

 C) Recuperación de contraseña
 ─────────────────────────────
 /auth  ──resetPasswordForEmail(email, { redirectTo: origin + '/reset-password' })──►
     correo ──► /reset-password ──updateUser({ password })──► sesión activa ──► /

 D) Autorización en servidor
 ───────────────────────────
 Cliente ──Authorization: Bearer <JWT>──► Edge Function
                                             ├─ auth.getClaims(token)  → 401 si falla
                                             ├─ rpc has_role(sub,'admin') → 403 si no admin
                                             └─ service_role para operaciones privilegiadas
```

## Tiempo real / streaming del chat

El chat no usa Realtime de Postgres: usa **streaming SSE** desde la edge function.

```text
ChatInput ──► Chat.tsx
   │  1. INSERT chat_messages (role='user')  ──► Postgres (RLS por conversación)
   │  2. Sube adjuntos ──► storage: chat-attachments (privado)
   │     INSERT chat_attachments (file_url)
   │
   └──3. fetch POST /functions/v1/chat  { messages, model, searchMode }
                 Authorization: Bearer <JWT>
                        │
                        ├─ valida JWT
                        ├─ elige system prompt: normal | Modo Búsqueda
                        └─ AI Gateway (stream: true)
                                 │
             text/event-stream ◄─┘
                        │
   ◄────────────────────┘  chunks "data: {...}\n\n"
   4. Render incremental en ChatMessages (markdown + badge Chat/Búsqueda)
   5. Al terminar: INSERT chat_messages (role='assistant')
      y si searchMode ─► UPDATE chat_conversations.has_search_messages = true
         (trigger update_updated_at_column refresca updated_at → reordena el sidebar)
```
