# Índice del repositorio

Qué hay en cada carpeta, de qué es responsable y cómo se conecta con las demás capas.

```text
.
├── index.html                  Documento raíz: metadatos SEO, manifest y meta tags PWA/iOS
├── vite.config.ts              Build, alias "@" → src, puerto 8080, vite-plugin-pwa
├── tailwind.config.ts          Tokens de diseño, tipografías y animaciones
├── vitest.config.ts            Configuración de tests (jsdom + setup global)
├── eslint.config.js            Reglas de lint
├── public/                     Estáticos servidos tal cual (iconos PWA, favicon, robots.txt)
├── src/                        Aplicación cliente
├── supabase/                   Backend: configuración, migraciones y edge functions
└── docs/                       Esta documentación
```

## `src/` — Aplicación cliente

| Carpeta / archivo | Responsabilidad | Conexiones |
| --- | --- | --- |
| `main.tsx` | Punto de entrada; monta `App` y registra el service worker. | → `App.tsx` |
| `App.tsx` | Providers (React Query, tema, `AuthProvider`, tooltips, toasts) y tabla de rutas. | → `pages/`, `hooks/useAuth` |
| `pages/` | Una pantalla por ruta. Orquestan datos y composición; no hablan directamente con SQL más allá de consultas simples. | → `hooks/`, `components/` |
| `components/` | Componentes de dominio reutilizables (tarjetas de prompt, diálogos, navegación). | → `components/ui/`, `hooks/` |
| `components/ui/` | Primitivas shadcn/ui (button, dialog, select…). Sin lógica de negocio. | ← todo el resto de la UI |
| `components/chat/` | Piezas del chat: input, mensajes, sidebar, selector de modelo, grabador de audio, toggle de búsqueda. | → edge functions `chat`, `transcribe-audio` |
| `components/landing/` | Secciones de la landing: Hero, Cómo Funciona, Casos de Uso, Testimonios, CTA. | ← `pages/Index.tsx` |
| `components/admin/` | Diálogos de alta/edición y borrado de usuarios. | → edge function `admin-users` |
| `hooks/` | Capa de acceso a datos y estado compartido: un hook por dominio (`usePrompts`-like, `useCollections`, `useTags`, `useChatConversations`, `useAdmin`, `useAuth`, `useProfile`…). | → `integrations/supabase/client` |
| `lib/` | Utilidades puras sin estado: `utils.ts` (`cn`), `categories.ts`, `collectionColors.ts`. | ← componentes y hooks |
| `integrations/supabase/` | Cliente tipado (`client.ts`) y tipos generados (`types.ts`). **Autogenerado, no editar.** | → Data API, Auth, Storage, Functions |
| `integrations/lovable/` | Utilidades de la plataforma. | — |
| `assets/` | Imágenes importadas por el bundler (logos, fotos de testimonios). | ← componentes |
| `index.css` | Design system: variables CSS de color, tema claro/oscuro, estilos de markdown del chat. | ← `tailwind.config.ts` |
| `test/` | `setup.ts` global y tests de ejemplo. | — |

**Flujo típico**: `pages/X.tsx` → `hooks/useY()` → `integrations/supabase/client` → Data API
(con RLS) o `supabase.functions.invoke()` → edge function → AI Gateway / `service_role`.

## `supabase/` — Backend

| Ruta | Responsabilidad |
| --- | --- |
| `config.toml` | Configuración del proyecto y `verify_jwt` por función. **Autogenerado.** |
| `migrations/` | Historial versionado del esquema: tablas, `GRANT`, RLS, políticas, funciones y triggers. |
| `functions/chat/` | Proxy de streaming SSE hacia el AI Gateway; elige el system prompt según `searchMode`. |
| `functions/improve-prompt/` | Optimización de prompts; devuelve JSON estructurado. |
| `functions/transcribe-audio/` | Transcripción de audio base64 con Gemini. |
| `functions/admin-users/` | CRUD de cuentas con `service_role`; exige rol `admin`. |

Los secretos (`LOVABLE_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, …) solo existen en el entorno de
las funciones; nunca llegan al bundle del cliente.

## `public/`

Servido sin procesar: `favicon.svg`, `pwa-icon.svg`, `pwa-icon-maskable.svg`, `pwa-512x512.png`,
`robots.txt`, `placeholder.svg`. Referenciados desde `index.html` y el manifest generado por
`vite-plugin-pwa`.

## Cómo se conectan las capas

```text
public/ + index.html
        │ (cáscara y assets estáticos)
        ▼
src/main.tsx → src/App.tsx ──► src/pages/*
                                   │
                                   ├──► src/components/*  ──► src/components/ui/*
                                   │            └──► src/lib/* (utilidades puras)
                                   └──► src/hooks/*
                                              │
                                              ▼
                              src/integrations/supabase/client.ts
                                    │                        │
                     Data API (RLS) ▼                        ▼ functions.invoke
                        supabase/migrations/*        supabase/functions/*
                                                              │
                                                              ▼
                                                      Lovable AI Gateway
```

## Documentación relacionada

- [`README.md`](../README.md) — visión general y arranque rápido.
- [`CONTRIBUTING.md`](../CONTRIBUTING.md) — entorno local, tests, lint y builds.
- [`CHANGELOG.md`](../CHANGELOG.md) — historial de versiones.
- [`docs/architecture.md`](./architecture.md) — diagramas de sistema, BD, auth y streaming.
- [`docs/api.md`](./api.md) — rutas, edge functions, RPC y contratos de datos.
- [`docs/deployment.md`](./deployment.md) — staging, producción, variables de entorno y builds.
- [`docs/admin-authorization.md`](./admin-authorization.md) — reglas de acceso al panel admin.
