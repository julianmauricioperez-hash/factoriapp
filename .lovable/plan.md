## Plan: Gestión Manual de Usuarios en el Panel de Admin

Agregar una nueva sección en `/admin` que permita al administrador **crear, actualizar y eliminar** usuarios directamente, sin que el usuario tenga que registrarse por sí mismo.

---

### 1. Backend — Edge Function `admin-users`

Como las operaciones de creación/eliminación de usuarios en `auth.users` requieren la **Service Role Key** (no se pueden hacer desde el cliente), se creará una edge function protegida.

**Archivo:** `supabase/functions/admin-users/index.ts`

Operaciones soportadas (vía POST con `action`):
- `create`: crea un usuario con email + contraseña (confirmado automáticamente). Opcionalmente marca como admin.
- `update`: actualiza email y/o contraseña de un usuario existente. Opcionalmente alterna rol admin.
- `delete`: elimina el usuario de `auth.users` (cascade limpia prompts, colecciones, etc. si tienen FK; si no, también limpia manualmente).

Seguridad:
- Validar JWT del llamante.
- Verificar con `has_role(user_id, 'admin')` que el llamante es admin antes de cualquier operación.
- Usar `supabase.auth.admin.createUser / updateUserById / deleteUser` con la Service Role Key.
- Validar inputs con Zod (email válido, contraseña ≥ 8 caracteres).
- CORS habilitado.

### 2. Roles — permitir asignar admin

Como `user_roles` actualmente no tiene políticas de INSERT/UPDATE/DELETE, la edge function (con Service Role) podrá insertar/eliminar la fila `('admin')` para el usuario objetivo. No se requiere migración.

### 3. Frontend — UI en `src/pages/Admin.tsx`

Añadir, encima de la tabla "Usuarios Registrados":
- Botón **"Nuevo usuario"** que abre un diálogo.
- En cada fila de la tabla, una columna de **acciones** con botones **Editar** y **Eliminar**.

**Nuevos componentes:**
- `src/components/admin/UserFormDialog.tsx` — diálogo reutilizable para crear/editar (campos: email, contraseña, checkbox "Es administrador"). En modo edición, contraseña es opcional (vacío = no cambiar).
- `src/components/admin/DeleteUserDialog.tsx` — `AlertDialog` de confirmación.

**Modificaciones a `Admin.tsx`:**
- Importar los nuevos diálogos y estado para abrirlos.
- Tras cada acción exitosa, refrescar la lista llamando de nuevo a `admin_list_users_with_stats`.
- Mostrar toasts de éxito/error.

Las llamadas se harán con `supabase.functions.invoke('admin-users', { body: { action, ... } })`.

### 4. Detectar si un usuario es admin en la lista

Para mostrar un badge "Admin" y saber el estado inicial del checkbox al editar, extender `admin_list_users_with_stats` con un campo booleano `is_admin`. Esto requiere una migración pequeña (CREATE OR REPLACE de la función).

---

### Archivos

| Archivo | Acción |
|---|---|
| `supabase/functions/admin-users/index.ts` | Crear |
| `src/components/admin/UserFormDialog.tsx` | Crear |
| `src/components/admin/DeleteUserDialog.tsx` | Crear |
| `src/pages/Admin.tsx` | Modificar — botones, columna acciones, integración diálogos |
| Migración SQL | `admin_list_users_with_stats` ahora retorna `is_admin boolean` |

### Notas de seguridad
- Toda la lógica sensible vive en la edge function detrás de `has_role(..., 'admin')`.
- El cliente nunca toca la Service Role Key.
- Validación con Zod en el servidor + validación básica en el formulario.
- Confirmación obligatoria antes de eliminar.
