# Guía de despliegue (staging y producción)

Cómo generar builds, qué variables de entorno intervienen y cómo publicar Factoría
en un entorno de staging y en producción.

## 1. Entornos

| Entorno | Origen | URL | Backend | Uso |
| --- | --- | --- | --- | --- |
| **Local** | `npm run dev` | `http://localhost:8080` | Mismo proyecto de Lovable Cloud | Desarrollo diario. |
| **Preview / Staging** | Preview de Lovable (se actualiza en cada cambio) | `https://id-preview--<id>.lovable.app` | Mismo proyecto de Lovable Cloud | Validación antes de publicar. |
| **Producción** | Botón **Publish** | `https://factoria.lovable.app` y `https://lafactoria.lat` | Mismo proyecto de Lovable Cloud | Usuarios finales. |

> **Importante:** preview y producción comparten la misma base de datos y los mismos
> secretos. Cualquier migración o cambio de datos afecta a ambos. Si necesitas un
> staging con datos aislados, hay que duplicar el proyecto (Remix) y conectar un
> backend propio.

## 2. Variables de entorno

### Cliente (build-time, Vite)

Viven en el `.env` de la raíz y son **generadas automáticamente** por la conexión de
Lovable Cloud. **No editar a mano ni borrar.**

| Variable | Ejemplo | Descripción |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | `https://<project-ref>.supabase.co` | Endpoint de la Data API/Auth. |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `eyJhbGciOi...` | Clave publicable (anon). Segura en el navegador: RLS protege los datos. |
| `VITE_SUPABASE_PROJECT_ID` | `<project-ref>` | Identificador del proyecto; se usa para construir URLs de edge functions. |

Vite las sustituye **en tiempo de build**. Si faltan al construir o publicar, el cliente
se inicializa con `undefined` y la app publicada queda en blanco o falla en todas las
peticiones. Solución: restaurar los valores o reconectar Lovable Cloud — nunca dejarlas
vacías ni escribirlas a mano.

Solo se exponen al navegador las variables con prefijo `VITE_`.

### Servidor (runtime, edge functions)

Configuradas en el entorno del backend, nunca en el bundle:

| Secreto | Usado por |
| --- | --- |
| `LOVABLE_API_KEY` | `chat`, `improve-prompt`, `transcribe-audio` (AI Gateway). |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY` | Validación del JWT del usuario en todas las funciones. |
| `SUPABASE_SERVICE_ROLE_KEY` | `admin-users` (operaciones privilegiadas). |
| `SUPABASE_DB_URL`, `SUPABASE_JWKS`, `SUPABASE_PUBLISHABLE_KEYS`, `SUPABASE_SECRET_KEYS` | Gestionados por la plataforma. |

El `service_role` y la contraseña de la base de datos no son accesibles desde el
proyecto y nunca deben aparecer en código, logs ni respuestas.

### Secretos de build (workspace)

Solo necesarios si se instalan paquetes npm privados. Se configuran manualmente en
**Workspace Settings → Build Secrets** y se referencian desde `.npmrc`. No son visibles
para las edge functions.

## 3. Generar builds

```sh
npm ci                 # instalación reproducible
npm run lint
npm run test
npx tsc --noEmit
npm run build          # salida en dist/
npm run preview        # sirve dist/ para verificación local
```

Para depurar un problema que solo aparece en el bundle, usa un build sin minificar:

```sh
npm run build:dev
npm run preview
```

Comprobaciones sobre `dist/`:
- `dist/index.html` contiene `<title>` y `<meta name="description">` correctos.
- Existen `dist/sw.js` y `dist/manifest.webmanifest` (PWA).
- El bundle **no** contiene cadenas de secretos de servidor (`grep -r "service_role" dist/` debe salir vacío).

## 4. Publicar

### Staging (preview)

No requiere acción: el preview se reconstruye con cada cambio guardado. Verifica allí:

1. Landing pública y `/library` sin sesión.
2. Login con email y con Google (el redirect debe volver al origen, no quedar atrapado en el service worker).
3. Chat con streaming y adjuntos.
4. `/admin` con una cuenta admin y con una no admin
   (ver [reglas de autorización](./admin-authorization.md)).

### Producción

1. Ejecuta el checklist de la sección 3.
2. Pulsa **Publish** en Lovable (o "Update" si ya estaba publicado).
3. Espera a que la URL de producción responda y haz un **hard refresh** (`Ctrl/Cmd + Shift + R`):
   la PWA cachea agresivamente y una versión antigua del service worker puede servir assets viejos.
4. Revisa la consola del navegador y los logs de las edge functions.

### Dominio personalizado

Project → Settings → Domains. El dominio activo es `lafactoria.lat`. Tras cambiar el
dominio, verifica que las URLs de redirección de Auth (Site URL y Redirect URLs) incluyan
el nuevo origen; si no, Google OAuth y el enlace de recuperación de contraseña fallarán.

## 5. Migraciones de base de datos

- Se aplican mediante migraciones versionadas en `supabase/migrations/`, **antes** de publicar
  el frontend que las necesita.
- Toda tabla nueva en `public` debe incluir `GRANT`, `ENABLE ROW LEVEL SECURITY` y políticas
  en la misma migración.
- Las migraciones no se revierten automáticamente: para deshacer un cambio, escribe una
  migración nueva que lo compense.
- Las edge functions se despliegan junto con el proyecto; un cambio de contrato debe ser
  compatible hacia atrás mientras haya clientes con el bundle anterior en caché.

## 6. Rollback

1. Usa el historial de versiones de Lovable para restaurar el código a un punto anterior y
   vuelve a publicar.
2. Si el problema es de esquema, aplica una migración correctiva (no restaures el código
   esperando que la base de datos vuelva atrás).
3. Si los usuarios siguen viendo la versión rota, es caché del service worker: pídeles un
   hard refresh o reinstalar la PWA.

## 7. Errores frecuentes en despliegue

| Síntoma | Causa | Solución |
| --- | --- | --- |
| Pantalla en blanco en producción | Faltan `VITE_SUPABASE_*` en el build | Restaurar `.env` / reconectar Lovable Cloud y republicar. |
| Todas las peticiones dan 401 | Clave publicable desactualizada tras rotar llaves | Reconectar el backend para regenerar `.env`. |
| Google OAuth: "Unsupported provider" o redirect inválido | Origen de producción no está en las Redirect URLs | Añadir el dominio en la configuración de Auth. |
| Cambios no visibles tras publicar | Service worker con caché previa | Hard refresh o desinstalar/reinstalar la PWA. |
| Edge function responde 500 | Secreto ausente (`LOVABLE_API_KEY`) | Revisar los secretos del backend y los logs de la función. |
| `permission denied for table X` | Migración sin `GRANT` | Añadir los `GRANT` en una migración nueva. |
