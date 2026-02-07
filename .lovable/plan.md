

## Mejoras a la seccion de Colecciones

Cuatro mejoras para enriquecer la experiencia de gestion de colecciones en Factoria.

---

### 1. Busqueda dentro de coleccion

Al abrir una coleccion, se mostrara un campo de busqueda para filtrar prompts por texto o categoria.

- Se agrega un `Input` con icono de lupa en la parte superior del modal de la coleccion (debajo del titulo).
- Filtra en tiempo real los prompts mostrados por coincidencia en `prompt_text` o `category`.
- Se muestra un contador de resultados (ej: "3 de 12 prompts").
- Boton X para limpiar la busqueda rapidamente.
- Solo se filtra visualmente (no se hacen nuevas consultas a la base de datos).

---

### 2. Estadisticas de coleccion

Dentro del modal de la coleccion, se agrega una seccion de resumen con metricas utiles.

- Se muestra en la parte superior del modal (entre el titulo y los prompts):
  - Total de prompts en la coleccion.
  - Cantidad de favoritos.
  - Distribucion por categorias (las 3 categorias mas frecuentes con conteo).
  - Fecha del ultimo prompt agregado.
- Se presenta como una fila de tarjetas compactas con iconos, similar al dashboard de estadisticas existente.
- Los datos se calculan a partir de los prompts ya cargados (sin consultas adicionales).

---

### 3. Compartir coleccion completa

Permite generar un enlace publico para compartir todos los prompts de una coleccion.

**Cambio en base de datos (migracion SQL):**
- Agregar columnas a la tabla `collections`:
  - `is_public` (boolean, default false): indica si la coleccion es publica.
  - `public_slug` (text, nullable, unique): identificador unico para el enlace publico.
- Agregar politica RLS SELECT en `collections` para permitir lectura publica cuando `is_public = true`.
- Agregar politica RLS SELECT en `prompts` para permitir lectura de prompts cuya coleccion sea publica.

**En la interfaz:**
- Boton "Compartir" (icono Share2) en cada tarjeta de coleccion con `stopPropagation`.
- Al hacer clic se abre un dialogo similar al de compartir prompts individuales (`SharePromptDialog`):
  - Switch para activar/desactivar la visibilidad publica.
  - Al activar, se genera un slug automatico y se muestra el enlace publico.
  - Boton para copiar el enlace al portapapeles.
- Nueva pagina `/c/:slug` (ruta publica) que muestra la coleccion compartida con sus prompts, accesible sin autenticacion.

---

### 4. Arrastrar y soltar prompts

Permite reorganizar el orden de los prompts dentro del modal de la coleccion arrastrando las tarjetas.

**Cambio en base de datos (migracion SQL):**
- Agregar columna `sort_order` (integer, nullable) a la tabla `prompts` para almacenar el orden personalizado dentro de cada coleccion.

**En la interfaz:**
- Se agrega un icono de agarre (GripVertical) al lado de cada `PromptCard` dentro del modal de la coleccion.
- Al arrastrar y soltar una tarjeta, se recalcula el `sort_order` de los prompts afectados y se actualiza en la base de datos.
- Se implementa con HTML5 Drag and Drop nativo (sin dependencias externas) usando `onDragStart`, `onDragOver`, `onDrop`.
- Al soltar, se hace una actualizacion en lote (batch update) de los `sort_order` modificados.
- Los prompts se ordenan por `sort_order` (si existe) y luego por fecha como respaldo.

---

### Detalles tecnicos

**Migracion SQL:**
- Columnas nuevas en `collections`: `is_public` (boolean, default false), `public_slug` (text, unique, nullable).
- Columna nueva en `prompts`: `sort_order` (integer, nullable).
- Politica RLS: SELECT en `collections` cuando `is_public = true`.
- Politica RLS: SELECT en `prompts` cuando su coleccion asociada es publica.

**Archivos a modificar:**
- `src/pages/Collections.tsx`: Busqueda, estadisticas, drag and drop en el modal, boton de compartir en las tarjetas.
- `src/hooks/useCollections.ts`: Metodos para activar/desactivar visibilidad publica de la coleccion.

**Archivos a crear:**
- `src/components/ShareCollectionDialog.tsx`: Dialogo para compartir coleccion (similar a `SharePromptDialog`).
- `src/pages/SharedCollection.tsx`: Pagina publica `/c/:slug` para ver colecciones compartidas.
- Agregar ruta `/c/:slug` en `src/App.tsx`.

**Secuencia de implementacion:**
1. Migracion SQL (columnas y politicas RLS).
2. Busqueda dentro de coleccion (solo cambios en el modal existente).
3. Estadisticas de coleccion (seccion nueva en el modal).
4. Compartir coleccion completa (dialogo + pagina publica + ruta).
5. Arrastrar y soltar (drag and drop con sort_order).

