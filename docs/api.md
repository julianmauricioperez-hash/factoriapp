# Rutas, funciones y contratos de datos

Referencia de todas las rutas de la SPA, las edge functions, las RPC de base de datos y las
tablas expuestas por la Data API, con ejemplos de request/response y errores comunes.

---

## Rutas de la aplicación

Definidas en `src/App.tsx`.

| Ruta | Página | Acceso | Descripción |
| --- | --- | --- | --- |
| `/` | `Index.tsx` | Pública | Landing (sin sesión) o creación rápida de prompts (con sesión). |
| `/auth` | `Auth.tsx` | Pública | Login, registro, Google OAuth y solicitud de recuperación. |
| `/reset-password` | `ResetPassword.tsx` | Enlace por email | Define la nueva contraseña. |
| `/onboarding` | `Onboarding.tsx` | Privada | Guía de 4 pasos; marca `profiles.has_completed_onboarding`. |
| `/my-prompts` | `MyPrompts.tsx` | Privada | Listado, filtros, edición, export e import de prompts. |
| `/collections` | `Collections.tsx` | Privada | Colecciones, estadísticas, reordenamiento y compartir. |
| `/tags` | `Tags.tsx` | Privada | Gestión de tags y uso por prompt/chat. |
| `/chat` | `Chat.tsx` | Privada | Chat IA multimodal con modo búsqueda. |
| `/statistics` | `Statistics.tsx` | Privada | Métricas personales de uso. |
| `/library` | `PublicLibrary.tsx` | Pública | Biblioteca pública con búsqueda avanzada y likes. |
| `/p/:slug` | `SharedPrompt.tsx` | Pública | Prompt compartido por slug. |
| `/c/:slug` | `SharedCollection.tsx` | Pública | Colección compartida por slug. |
| `/install` | `Install.tsx` | Pública | Instrucciones de instalación PWA. |
| `/admin` | `Admin.tsx` | Rol `admin` | Métricas globales, gestión de usuarios y actividad. |
| `*` | `NotFound.tsx` | Pública | 404. |

> Las rutas privadas redirigen a `/auth` cuando `useAuth()` no tiene sesión.
> `/admin` además comprueba `useAdmin()` (RPC `has_role`) y redirige a `/` si el usuario no es
> administrador. Detalle completo en [autorización del panel admin](./admin-authorization.md).

---

## Edge functions

Base URL: `https://<project-ref>.supabase.co/functions/v1/<nombre>`.
Invocación recomendada desde el cliente:

```ts
const { data: { session } } = await supabase.auth.getSession();
const { data, error } = await supabase.functions.invoke("improve-prompt", {
  body: { promptText, category },
});
```

Todas las funciones:
- Responden `OPTIONS` con cabeceras CORS.
- Exigen `Authorization: Bearer <JWT>` y validan el token con `auth.getClaims()`.
- Devuelven errores como `{ "error": "..." }` con el status correspondiente.

### `POST /chat`

Chat con streaming SSE.

**Request**

```json
{
  "messages": [
    { "role": "user", "content": "Resume este texto" },
    {
      "role": "user",
      "content": [
        { "type": "text", "text": "¿Qué ves en la imagen?" },
        { "type": "image_url", "image_url": { "url": "data:image/png;base64,..." } }
      ]
    }
  ],
  "model": "google/gemini-3-flash-preview",
  "searchMode": false
}
```

| Campo | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| `messages` | `Array<{role, content}>` | Sí | `content` string o array multimodal. |
| `model` | `string` | No | Si no está en la lista permitida, cae a `google/gemini-3-flash-preview`. |
| `searchMode` | `boolean` | No | Activa el system prompt de búsqueda estructurada. |

Modelos permitidos: `google/gemini-3-flash-preview`, `google/gemini-3-pro-preview`,
`google/gemini-2.5-pro`, `google/gemini-2.5-flash`, `openai/gpt-5`, `openai/gpt-5-mini`,
`openai/gpt-5.2`.

**Response** `200 text/event-stream`

```
data: {"choices":[{"delta":{"content":"Hola"}}]}

data: {"choices":[{"delta":{"content":" mundo"}}]}

data: [DONE]
```

**Errores**

| Status | Body | Causa |
| --- | --- | --- |
| 401 | `{"error":"Unauthorized"}` | Falta el header `Authorization` o el JWT es inválido/expirado. |
| 400 | `{"error":"Se requiere un array de mensajes"}` | `messages` ausente o no es array. |
| 429 | `{"error":"Límite de solicitudes excedido..."}` | Rate limit del gateway. |
| 402 | `{"error":"Créditos de IA agotados..."}` | Sin créditos de IA. |
| 500 | `{"error":"Error al comunicarse con el servicio de IA"}` | Fallo del gateway. |

### `POST /improve-prompt`

Optimiza un prompt con IA.

**Request**

```json
{ "promptText": "escribe un email de ventas", "category": "Marketing" }
```

**Response** `200`

```json
{
  "improved_prompt": "Actúa como copywriter B2B. Escribe un email de ventas de 120 palabras...",
  "improvements": ["Se añadió un rol explícito", "Se definió longitud y tono"],
  "tips": ["Incluye el perfil del destinatario", "Define el CTA esperado"]
}
```

Si el modelo no devuelve JSON válido, la función responde igualmente con esa forma,
usando el texto crudo en `improved_prompt`.

**Errores**: `401` sin JWT · `400` `{"error":"El texto del prompt es requerido"}` ·
`429` / `402` / `500` como en `/chat`.

### `POST /transcribe-audio`

Transcribe audio a texto con Gemini 2.5 Flash.

**Request**

```json
{ "audio": "<base64 sin prefijo data:>", "mimeType": "audio/webm" }
```

**Response** `200`

```json
{ "text": "Necesito un prompt para generar descripciones de producto." }
```

**Errores**: `401` sin JWT · `400` `{"error":"Se requiere el audio en base64"}` ·
`429` / `402` · `500` `{"error":"Error al transcribir el audio"}`.

### `POST /admin-users`

Gestión de cuentas. Requiere JWT **y** rol `admin` (verificado con `has_role` usando
`service_role`). Body validado con Zod y discriminado por `action`.

**Crear**

```json
{ "action": "create", "email": "nuevo@ejemplo.com", "password": "MiClave123", "is_admin": false }
```
→ `200 { "ok": true, "user_id": "uuid" }` (el email queda confirmado automáticamente).

**Actualizar** — todos los campos salvo `user_id` son opcionales:

```json
{ "action": "update", "user_id": "uuid", "email": "otro@ejemplo.com", "password": "", "is_admin": true }
```
→ `200 { "ok": true }`

**Eliminar**

```json
{ "action": "delete", "user_id": "uuid" }
```
→ `200 { "ok": true }`

**Errores**

| Status | Body | Causa |
| --- | --- | --- |
| 401 | `{"error":"Unauthorized"}` | Sin JWT válido. |
| 403 | `{"error":"Forbidden"}` | El usuario autenticado no es admin. |
| 400 | `{"error":{ "fieldErrors": {...} }}` | Body inválido (email mal formado, password < 8, uuid inválido). |
| 400 | `{"error":"No puedes eliminar tu propia cuenta"}` | `delete` sobre uno mismo. |
| 400 | `{"error":"No puedes quitarte tu propio rol de administrador"}` | `is_admin:false` sobre uno mismo. |
| 500 | `{"error":"..."}` | Error inesperado. |

---

## Funciones RPC de base de datos

Se invocan con `supabase.rpc(...)`.

### `has_role(_user_id uuid, _role app_role) → boolean`

```ts
const { data: isAdmin } = await supabase.rpc("has_role", {
  _user_id: user.id, _role: "admin",
});
// → true | false
```
`SECURITY DEFINER`, solo `authenticated`. Usada también dentro de las políticas RLS.

### `admin_list_users_with_stats() → setof`

Solo admin; lanza `Access denied` en caso contrario.

```json
[
  {
    "id": "uuid",
    "email": "usuario@ejemplo.com",
    "created_at": "2026-03-04T12:00:00Z",
    "last_sign_in_at": "2026-08-27T09:11:00Z",
    "prompt_count": 42,
    "public_prompt_count": 7,
    "collection_count": 3,
    "conversation_count": 12,
    "is_admin": false
  }
]
```

### `admin_recent_activity() → setof`

Últimos 20 prompts creados (texto truncado a 120 caracteres). Solo admin.

```json
[
  {
    "prompt_id": "uuid",
    "prompt_text": "Actúa como analista financiero y...",
    "category": "Negocios",
    "created_at": "2026-08-28T14:02:00Z",
    "user_email": "usuario@ejemplo.com"
  }
]
```

### `admin_list_users() → setof`

Versión reducida (`id`, `email`, `created_at`, `last_sign_in_at`). Solo admin.

### `get_prompt_like_counts(prompt_ids uuid[]) → setof`

Conteo agregado de likes sin exponer quién dio like. Invocable por `anon`.

```ts
const { data } = await supabase.rpc("get_prompt_like_counts", { prompt_ids: ids });
// → [{ prompt_id: "uuid", like_count: 12 }]
```

### `generate_prompt_slug()` / `generate_collection_slug() → text`

Devuelven un slug único de 12 caracteres. Requieren sesión (lanzan
`Authentication required` si `auth.uid()` es `NULL`).

**Error común de RPC**: `permission denied for function ...` → el rol no tiene `EXECUTE`
(por diseño, `anon` solo puede ejecutar `get_prompt_like_counts`).

---

## Contratos de datos (Data API)

Tipos generados en `src/integrations/supabase/types.ts`. Formas principales:

```ts
type Prompt = {
  id: string;
  user_id: string | null;
  category: string;
  prompt_text: string;
  is_favorite: boolean;
  is_public: boolean;
  public_slug: string | null;
  collection_id: string | null;
  sort_order: number | null;
  created_at: string;           // ISO 8601
};

type Collection = {
  id: string; user_id: string;
  name: string; description: string | null;
  color: string | null;         // clave de src/lib/collectionColors.ts
  is_public: boolean; public_slug: string | null;
  created_at: string;
};

type Tag = { id: string; user_id: string; name: string; color: string | null; created_at: string };

type ChatConversation = {
  id: string; user_id: string; title: string;
  is_favorite: boolean; has_search_messages: boolean;
  created_at: string; updated_at: string;
};

type ChatMessage = {
  id: string; conversation_id: string;
  role: "user" | "assistant";
  content: string; prompt_id: string | null; created_at: string;
};

type ChatAttachment = {
  id: string; message_id: string;
  file_type: string; file_name: string;
  file_url: string;               // ruta en el bucket; se firma por 1h al mostrarla
  created_at: string;
};

type Profile = { id: string; has_completed_onboarding: boolean; created_at: string };
type UserRole = { id: string; user_id: string; role: "admin" | "user"; created_at: string };
```

### Ejemplos

**Crear un prompt**

```ts
const { data, error } = await supabase
  .from("prompts")
  .insert({ prompt_text: "Actúa como...", category: "Marketing", user_id: user.id })
  .select()
  .single();
```

**Listar prompts públicos con filtros combinados**

```ts
const { data } = await supabase
  .from("prompts")
  .select("id, prompt_text, category, created_at, public_slug")
  .eq("is_public", true)
  .ilike("prompt_text", `%${query}%`)
  .gte("created_at", desde.toISOString())
  .order("created_at", { ascending: false });
```

**Adjunto de chat (URL firmada)**

```ts
const { data } = await supabase.storage
  .from("chat-attachments")
  .createSignedUrl(path, 3600);
```

### Errores comunes de la Data API

| Código | Mensaje típico | Causa y solución |
| --- | --- | --- |
| `42501` | `new row violates row-level security policy` | Falta `user_id: user.id` en el insert o la sesión expiró. |
| `42501` | `permission denied for table X` | Faltan `GRANT` para el rol; añádelos en la migración. |
| `PGRST116` | `JSON object requested, multiple (or no) rows returned` | `.single()` sin resultados; usa `.maybeSingle()`. |
| `23505` | `duplicate key value violates unique constraint` | Slug o par `(user_id, role)` repetido. |
| `23503` | `violates foreign key constraint` | Referencia a una colección/tag inexistente o ya borrada. |
| `401` | `JWT expired` | Refresca la sesión (`supabase.auth.getSession()`) y reintenta. |
| — | Lista vacía sin error | RLS filtró todo: la consulta es válida pero no hay filas visibles para ese usuario. |
