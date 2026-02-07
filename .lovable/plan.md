

## Mejoras a la Biblioteca Publica

Tres mejoras seleccionadas para enriquecer la experiencia en la Biblioteca Publica de Factoria.

---

### 1. Guardar prompts en tu coleccion

Permite que los usuarios autenticados guarden un prompt publico directamente como uno propio (copia privada).

- Se agrega un boton "Guardar" (icono de bookmark/download) en cada tarjeta de prompt publico.
- Al hacer clic, se crea una copia del prompt en la tabla `prompts` con el `user_id` del usuario actual, `is_public = false` y `is_favorite = false`.
- Si el usuario no esta autenticado, se muestra un aviso y se redirige a `/auth`.
- Se muestra un toast confirmando "Prompt guardado en tus prompts".

---

### 2. Vista previa expandible

Actualmente los prompts se muestran truncados a 4 lineas (`line-clamp-4`). Con esta mejora:

- Al hacer clic en una tarjeta, se abre un **Dialog (modal)** con el texto completo del prompt.
- El modal muestra:
  - Categoria como badge
  - Texto completo del prompt (scroll si es largo)
  - Fecha de creacion
  - Etiquetas del prompt (si las tiene)
  - Botones de accion: Copiar, Guardar, Like, Compartir enlace
- Se puede cerrar con X o haciendo clic fuera.

---

### 3. Etiquetas visibles y filtrables

Mostrar las etiquetas de los prompts publicos y permitir filtrar por ellas.

**Cambio en base de datos:**
- Se necesita una nueva politica RLS en `prompt_tags` que permita a cualquiera leer las etiquetas de prompts publicos:
  ```
  SELECT en prompt_tags WHERE el prompt asociado es publico (is_public = true)
  ```
- Tambien se necesita una politica RLS en `tags` para que cualquiera pueda ver etiquetas que estan asociadas a prompts publicos.

**En la interfaz:**
- Cada tarjeta de prompt muestra sus etiquetas como badges debajo del texto.
- Se agrega una barra de filtro por etiquetas en la parte superior (similar al `TagsFilter` existente en Mis Prompts).
- Las etiquetas disponibles en el filtro se extraen de los prompts publicos cargados.

---

### Detalles tecnicos

**Migracion SQL (nueva):**
- Agregar politica RLS SELECT en `prompt_tags` para permitir lectura publica cuando el prompt es publico.
- Agregar politica RLS SELECT en `tags` para permitir lectura de etiquetas asociadas a prompts publicos.

**Hook `usePublicPrompts.ts` - Modificar:**
- Extender la consulta para incluir las etiquetas de cada prompt via la relacion `prompt_tags -> tags`.
- Actualizar la interfaz `PublicPrompt` para incluir un array de tags (`{ id, name, color }`).

**Pagina `PublicLibrary.tsx` - Modificar:**
- Agregar boton "Guardar" en cada tarjeta (con logica de insercion en `prompts`).
- Agregar componente de modal/dialog para vista expandida del prompt.
- Agregar seccion de etiquetas en cada tarjeta y barra de filtro de etiquetas.
- Agregar estado para etiquetas seleccionadas y logica de filtrado.

**Archivos a crear:**
- Ninguno nuevo (se reutilizan componentes existentes como `Dialog`, `Badge`, `TagsFilter`).

**Archivos a modificar:**
- `src/hooks/usePublicPrompts.ts` - Incluir tags en la consulta.
- `src/pages/PublicLibrary.tsx` - Boton guardar, modal de vista previa, filtro de etiquetas.
- Migracion SQL para las nuevas politicas RLS.

