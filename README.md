# Factoría

**Factoría** es una aplicación web (PWA) para crear, organizar, compartir y optimizar prompts de IA.
Incluye biblioteca personal y pública, colecciones, etiquetas, variables `{{variable}}`, chat IA
multimodal con modo búsqueda, estadísticas y un panel de administración.

## Índice de documentación

| Documento | Contenido |
| --- | --- |
| [CHANGELOG.md](./CHANGELOG.md) | Versiones y cambios recientes. |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | Entorno local, tests, lint, builds y convenciones. |
| [docs/architecture.md](./docs/architecture.md) | Diagramas: sistema end-to-end, base de datos, auth y streaming. |
| [docs/api.md](./docs/api.md) | Rutas, edge functions, RPC y contratos de datos con ejemplos. |
| [docs/repo-index.md](./docs/repo-index.md) | Índice del repositorio y responsabilidad de cada carpeta. |
| [docs/deployment.md](./docs/deployment.md) | Despliegue en staging y producción, variables de entorno y builds. |
| [docs/admin-authorization.md](./docs/admin-authorization.md) | Reglas de autorización del panel admin y respuestas 401/403. |

## Funcionalidades

- **Prompts**: CRUD con categorías, etiquetas, favoritos, variables y plantillas.
- **Colecciones**: agrupación con color, estadísticas, orden manual y enlace público.
- **Compartir**: slugs públicos para prompts (`/p/:slug`) y colecciones (`/c/:slug`).
- **Biblioteca pública**: búsqueda combinada por texto, categoría, tags, popularidad y fecha; likes y clonado.
- **Chat IA**: 7 modelos (Gemini y GPT), adjuntos (imágenes, documentos, audio), streaming y Modo Búsqueda.
- **Import/Export**: JSON y CSV, con vista previa en la importación masiva.
- **Auth**: email + contraseña, Google OAuth, recuperación de contraseña y protección HIBP.
- **Admin**: métricas globales, estadísticas por usuario, actividad reciente y gestión de cuentas.
- **PWA**: instalable, con service worker, iconos propios y página `/install`.

## Stack

React 18 · Vite 5 · TypeScript · Tailwind CSS · shadcn/ui · React Router · React Query ·
Lovable Cloud (Postgres + Auth + Storage + Edge Functions) · Lovable AI Gateway (Gemini / GPT).

## Arranque rápido

```sh
npm install
npm run dev     # http://localhost:8080
```

Pasos detallados, scripts y checklist previo a un PR en [CONTRIBUTING.md](./CONTRIBUTING.md).

## Estructura resumida

```text
src/
  pages/        Una pantalla por ruta
  components/   UI de dominio + primitivas shadcn en components/ui
  hooks/        Acceso a datos y estado compartido
  lib/          Utilidades puras
  integrations/ Cliente y tipos del backend (autogenerado)
supabase/
  migrations/   Esquema versionado (tablas, RLS, funciones)
  functions/    chat · improve-prompt · transcribe-audio · admin-users
docs/           Arquitectura, API e índice del repositorio
```

Descripción completa en [docs/repo-index.md](./docs/repo-index.md).

## Despliegue

El proyecto se publica desde Lovable con el botón **Publish**. Dominios: Project → Settings → Domains.
