# Guía de contribución

Gracias por colaborar en **Factoría**. Esta guía cubre cómo levantar el proyecto, ejecutar tests,
lint y builds de forma consistente.

## Requisitos

| Herramienta | Versión mínima |
| --- | --- |
| Node.js | 20 LTS |
| npm | 10 (o `bun` / `pnpm`) |
| Git | 2.40 |

## 1. Levantar el proyecto localmente

```sh
git clone <URL_DEL_REPO>
cd <NOMBRE_DEL_REPO>
npm install
npm run dev
```

La app queda en `http://localhost:8080`.

### Variables de entorno

El archivo `.env` se genera automáticamente por Lovable Cloud y **no debe editarse a mano**:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
VITE_SUPABASE_PROJECT_ID=...
```

Son claves publicables (seguras en el cliente). Los secretos de servidor (`LOVABLE_API_KEY`,
`SUPABASE_SERVICE_ROLE_KEY`, etc.) viven solo en el entorno de las edge functions.

## 2. Scripts disponibles

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Servidor de desarrollo con HMR en el puerto 8080. |
| `npm run build` | Build de producción en `dist/`. |
| `npm run build:dev` | Build con modo `development` (sin minificar, útil para depurar). |
| `npm run preview` | Sirve el build de `dist/` localmente. |
| `npm run lint` | ESLint sobre todo el repositorio. |
| `npm run test` | Tests con Vitest en modo CI (una pasada). |
| `npm run test:watch` | Vitest en modo watch. |

Comprobación de tipos: `npx tsc --noEmit`.

## 3. Antes de abrir un PR

Ejecuta siempre, en este orden:

```sh
npm run lint
npm run test
npx tsc --noEmit
npm run build
```

Los cuatro deben terminar sin errores.

## 4. Tests

- Runner: **Vitest** + **@testing-library/react**, entorno `jsdom`.
- Configuración: `vitest.config.ts`; setup global en `src/test/setup.ts`.
- Ubicación: junto al código (`Component.test.tsx`) o en `src/test/`.

```sh
npm run test -- src/test/example.test.ts   # un archivo concreto
```

## 5. Convenciones de código

- **Estilos**: solo tokens semánticos definidos en `src/index.css` y `tailwind.config.ts`.
  Nunca `text-white`, `bg-black` ni `bg-[#hex]` en componentes — rompen el modo oscuro.
- **Componentes UI**: reutiliza `src/components/ui/` (shadcn) antes de crear uno nuevo.
- **Datos**: toda la lectura/escritura pasa por hooks en `src/hooks/` usando
  `import { supabase } from "@/integrations/supabase/client"`.
- **Archivos autogenerados — no editar**: `src/integrations/supabase/client.ts`,
  `src/integrations/supabase/types.ts`, `.env`, `supabase/config.toml`.
- **Idioma**: la interfaz y los mensajes al usuario están en español.

## 6. Base de datos y edge functions

- Los cambios de esquema se aplican como **migraciones** en `supabase/migrations/`.
  Toda tabla nueva en `public` requiere `GRANT`, `ENABLE ROW LEVEL SECURITY` y políticas en la misma migración.
- Las edge functions viven en `supabase/functions/<nombre>/index.ts` y se despliegan automáticamente.
  Todas deben: responder a `OPTIONS` con CORS, validar el JWT del `Authorization` header
  y validar el body con Zod.

Detalles en [`docs/architecture.md`](./docs/architecture.md) y [`docs/api.md`](./docs/api.md).

## 7. Commits

Formato recomendado (Conventional Commits):

```
feat(chat): añade filtro por modo en el sidebar
fix(auth): evita que el SW intercepte el redirect de OAuth
docs(readme): actualiza índice del repositorio
```

Registra los cambios relevantes en [`CHANGELOG.md`](./CHANGELOG.md) bajo `[Sin publicar]`.
