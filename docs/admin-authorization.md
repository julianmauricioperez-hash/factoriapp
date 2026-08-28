# Autorización del panel de administración

Reglas de acceso a `/admin`, a las RPC administrativas y a la edge function `admin-users`,
con ejemplos concretos de respuestas según el rol del usuario.

## 1. Modelo de roles

- Los roles **no** se guardan en `profiles` ni en ninguna tabla de perfil de usuario:
  viven en `public.user_roles` con el enum `app_role` (`'admin' | 'user'`), con
  `UNIQUE (user_id, role)`.
- La única fuente de verdad es la función `SECURITY DEFINER`
  `has_role(_user_id uuid, _role app_role) → boolean`. Se usa tanto en las políticas RLS
  como en las edge functions, evitando recursión en RLS.
- Ausencia de fila en `user_roles` = usuario normal. No existe un rol implícito por email
  ni por ninguna bandera en el cliente.
- **Nunca** se decide el acceso a partir de `localStorage`, props del cliente o del payload
  del JWT manipulable: cada capa vuelve a verificar contra la base de datos.

## 2. Las tres capas de control

```text
Capa 1 — UI (conveniencia, NO seguridad)
  useAdmin() → rpc has_role(user.id,'admin')
    sin sesión  → navigate('/auth')
    sin rol     → navigate('/')   y render null
    con rol     → renderiza el panel

Capa 2 — Base de datos (RLS + SECURITY DEFINER)
  admin_list_users_with_stats() / admin_recent_activity() / admin_list_users()
    IF NOT has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Access denied'
  user_roles: INSERT/UPDATE/DELETE solo si has_role(auth.uid(),'admin')
  EXECUTE revocado a PUBLIC y a anon; concedido solo a authenticated

Capa 3 — Edge function admin-users (service_role)
  1. Authorization: Bearer <JWT>      → falta o inválido        ⇒ 401
  2. auth.getClaims(token)            → claims inválidos        ⇒ 401
  3. rpc has_role(sub,'admin')        → no admin                ⇒ 403
  4. Zod sobre el body                → body inválido           ⇒ 400
  5. Reglas de negocio (auto-borrado / auto-degradación)        ⇒ 400
  6. Operación con service_role                                 ⇒ 200
```

Saltarse la Capa 1 (escribiendo `/admin` en la barra de direcciones o llamando a la API
con `curl`) no da acceso: las capas 2 y 3 rechazan igualmente la petición.

## 3. Reglas de negocio

| Regla | Motivo |
| --- | --- |
| Un admin no puede eliminar su propia cuenta. | Evita quedarse sin acceso al panel. |
| Un admin no puede quitarse a sí mismo el rol `admin`. | Evita bloquear la administración del proyecto. |
| Los usuarios creados desde el panel quedan con el email confirmado (`email_confirm: true`). | Alta manual sin correo de verificación. |
| La contraseña debe tener entre 8 y 128 caracteres; en `update`, cadena vacía = "no cambiar". | Validación Zod. |
| El rol se asigna insertando en `user_roles`, nunca actualizando el perfil. | Previene escalada de privilegios. |

## 4. Ejemplos por rol

Todas las llamadas van a
`POST https://<project-ref>.supabase.co/functions/v1/admin-users`.

### A. Sin sesión (anónimo) → **401**

```http
POST /functions/v1/admin-users
Content-Type: application/json

{ "action": "delete", "user_id": "8f1c...c9" }
```

```json
HTTP/1.1 401 Unauthorized
{ "error": "Unauthorized" }
```

Mismo resultado con un header malformado (`Authorization: abc`, sin `Bearer `) o con un
JWT caducado/falsificado: `auth.getClaims()` falla y la función corta antes de tocar datos.

En la base de datos, el equivalente para un anónimo es:

```json
{ "code": "42501", "message": "permission denied for function admin_list_users_with_stats" }
```

porque `EXECUTE` está revocado para `anon`.

### B. Sesión válida sin rol admin → **403**

```http
POST /functions/v1/admin-users
Authorization: Bearer <JWT de usuario normal>
Content-Type: application/json

{ "action": "create", "email": "nuevo@ejemplo.com", "password": "MiClave123" }
```

```json
HTTP/1.1 403 Forbidden
{ "error": "Forbidden" }
```

El token es válido (por eso no es 401), pero `has_role(sub,'admin')` devuelve `false`.

Llamando directamente a la RPC con ese mismo usuario:

```ts
const { data, error } = await supabase.rpc("admin_list_users_with_stats");
```

```json
{ "code": "P0001", "message": "Access denied", "details": null, "hint": null }
```

Y un intento de auto-promoción por la Data API:

```ts
await supabase.from("user_roles").insert({ user_id: user.id, role: "admin" });
```

```json
{ "code": "42501", "message": "new row violates row-level security policy for table \"user_roles\"" }
```

En la interfaz, este usuario que abre `/admin` es redirigido a `/` sin ver nada del panel.

### C. Sesión con rol admin → **200**

```http
POST /functions/v1/admin-users
Authorization: Bearer <JWT de admin>
Content-Type: application/json

{ "action": "create", "email": "nuevo@ejemplo.com", "password": "MiClave123", "is_admin": false }
```

```json
HTTP/1.1 200 OK
{ "ok": true, "user_id": "3b7a51c0-9f2e-4d18-9a44-1c0f2b6d77e1" }
```

### D. Admin con petición inválida → **400**

Body que no pasa Zod:

```json
{ "action": "create", "email": "no-es-un-email", "password": "123" }
```

```json
HTTP/1.1 400 Bad Request
{
  "error": {
    "formErrors": [],
    "fieldErrors": {
      "email": ["Invalid email"],
      "password": ["String must contain at least 8 character(s)"]
    }
  }
}
```

Reglas de negocio:

```json
{ "action": "delete", "user_id": "<el propio id del admin>" }
```
```json
HTTP/1.1 400 Bad Request
{ "error": "No puedes eliminar tu propia cuenta" }
```

```json
{ "action": "update", "user_id": "<el propio id del admin>", "is_admin": false }
```
```json
HTTP/1.1 400 Bad Request
{ "error": "No puedes quitarte tu propio rol de administrador" }
```

## 5. Resumen de códigos

| Situación | Código | Body |
| --- | --- | --- |
| Sin header `Authorization` o JWT inválido/caducado | `401` | `{"error":"Unauthorized"}` |
| JWT válido, usuario sin rol `admin` | `403` | `{"error":"Forbidden"}` |
| Admin con body inválido | `400` | `{"error":{"fieldErrors":{...}}}` |
| Admin intentando auto-eliminarse o auto-degradarse | `400` | `{"error":"No puedes ..."}` |
| Admin, operación correcta | `200` | `{"ok":true, "user_id"?:"uuid"}` |
| Error inesperado del servidor | `500` | `{"error":"..."}` |
| RPC admin ejecutada por no admin | `P0001` | `Access denied` |
| RPC admin ejecutada por `anon` | `42501` | `permission denied for function ...` |

## 6. Conceder el primer rol admin

`user_roles` solo admite escrituras de un admin existente, así que el primer administrador
se crea mediante una migración o desde `admin-users` con una cuenta que ya lo sea:

```sql
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin' FROM auth.users WHERE email = 'correo@ejemplo.com'
ON CONFLICT (user_id, role) DO NOTHING;
```

A partir de ahí, la gestión se hace desde `/admin`.

## 7. Diagnóstico

| Síntoma | Causa probable | Comprobación |
| --- | --- | --- |
| `/admin` redirige a `/` | El usuario no tiene fila en `user_roles` | `select * from user_roles where user_id = '<uuid>'` |
| `/admin` redirige a `/auth` | Sesión ausente o expirada | Volver a iniciar sesión. |
| Panel visible pero tablas vacías | Las RPC devuelven `Access denied` y el error se ignora en la UI | Revisar la respuesta de `admin_list_users_with_stats`. |
| 403 con una cuenta que sí es admin | JWT emitido antes de asignar el rol | Cerrar y volver a abrir sesión para refrescar el token. |
| Todo correcto pero se ve un 404 | Bundle antiguo en caché de la PWA | Hard refresh (`Ctrl/Cmd + Shift + R`). |

Contratos completos de la función y las RPC en [`docs/api.md`](./api.md#post-admin-users).
