# Changelog

Todas las modificaciones relevantes de **Factoría** se documentan en este archivo.
El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y el versionado es [SemVer](https://semver.org/lang/es/).

## [Sin publicar]

### Añadido
- Documentación completa del repositorio: [`CONTRIBUTING.md`](./CONTRIBUTING.md), [`docs/architecture.md`](./docs/architecture.md), [`docs/api.md`](./docs/api.md), [`docs/repo-index.md`](./docs/repo-index.md).
- Guía de despliegue para staging y producción con variables de entorno, builds y rollback: [`docs/deployment.md`](./docs/deployment.md).
- Documentación de las reglas de autorización del panel admin con ejemplos 401/403/400: [`docs/admin-authorization.md`](./docs/admin-authorization.md).

---

## [1.5.0] — Gestión de usuarios desde el panel admin

### Añadido
- Alta, edición y baja de usuarios desde `/admin` (`UserFormDialog`, `DeleteUserDialog`).
- Edge function `admin-users` con validación Zod y verificación de rol `admin` en servidor.
  Ver [contrato de `admin-users`](./docs/api.md#post-admin-users).
- Badge visual "Admin" en la tabla de usuarios.

### Seguridad
- No es posible eliminarse a uno mismo ni auto-revocarse el rol `admin`.
- `REVOKE EXECUTE ... FROM PUBLIC` en todas las funciones `SECURITY DEFINER`.
  Ver [modelo de seguridad](./docs/architecture.md#seguridad-y-rls).
- Activada la protección de contraseñas filtradas (HIBP) en Auth.

---

## [1.4.0] — Landing, búsqueda avanzada e importación

### Añadido
- Landing page con secciones Hero, Cómo Funciona, Casos de Uso, Testimonios (con fotos) y CTA
  (`src/components/landing/`). Ver [rutas públicas](./docs/api.md#rutas-de-la-aplicación).
- Búsqueda avanzada en la Biblioteca Pública: texto libre + categoría + tags + popularidad mínima + rango temporal.
- Importación masiva de prompts en JSON y CSV con vista previa (`ImportPromptsDialog`).
- Exportación de prompts y colecciones a JSON/CSV.

---

## [1.3.0] — Panel de administración

### Añadido
- Ruta `/admin` protegida por rol, con métricas globales, estadísticas por usuario y feed de actividad reciente.
- Tabla `user_roles`, enum `app_role` y función `has_role()`.
  Ver [diagrama de base de datos](./docs/architecture.md#base-de-datos).
- RPCs `admin_list_users_with_stats()` y `admin_recent_activity()`.
  Ver [contratos RPC](./docs/api.md#funciones-rpc-de-base-de-datos).

---

## [1.2.0] — Autenticación y recuperación de contraseña

### Añadido
- Flujo "¿Olvidaste tu contraseña?" y página `/reset-password`.

### Corregido
- Google OAuth fallaba en producción: el service worker interceptaba el redirect.
  Solucionado con `navigateFallbackDenylist` para `/~oauth` en la configuración PWA.

---

## [1.1.0] — PWA instalable

### Añadido
- Service worker con `vite-plugin-pwa`, manifest e iconos con el logo oficial.
- Página `/install` con instrucciones por plataforma y banner de instalación en el inicio.
- Favicon SVG con el logo oficial.

---

## [1.0.0] — Chat IA y modo búsqueda

### Añadido
- Chat multimodal (texto, imágenes, documentos, audio) con streaming SSE
  vía edge function `chat`. Ver [contrato de `chat`](./docs/api.md#post-chat).
- Selector con 7 modelos (Gemini 3 Flash/Pro, Gemini 2.5 Pro/Flash, GPT-5, GPT-5 mini, GPT-5.2).
- Modo Búsqueda web con system prompt especializado, indicador por mensaje y filtro en el sidebar
  (`chat_conversations.has_search_messages`).
- Transcripción de audio con `transcribe-audio`.

---

## [0.9.0] — Base de la aplicación

### Añadido
- CRUD de prompts, colecciones, categorías y tags con RLS por usuario.
- Compartir prompts y colecciones por slug público (`/p/:slug`, `/c/:slug`).
- Biblioteca pública con likes vía RPC `get_prompt_like_counts()`.
- Optimización de prompts con IA (`improve-prompt`), variables `{{variable}}` y plantillas.
- Onboarding de 4 pasos, estadísticas, modo claro/oscuro y navegación móvil.
