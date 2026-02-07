

## Ver prompts al hacer clic en una etiqueta

Similar a como funciona en Colecciones, al hacer clic en una etiqueta se abrira un Dialog (modal) mostrando todos los prompts que tienen esa etiqueta asignada.

---

### Comportamiento

- Al hacer clic en el nombre de una etiqueta (o en su fila), se abre un modal con los prompts asociados.
- El modal muestra:
  - El nombre de la etiqueta con su color en el encabezado.
  - La lista de prompts usando el componente `PromptCard` existente (mismo que en Colecciones).
  - Un mensaje si la etiqueta no tiene prompts asignados.
  - Un boton para cerrar el modal.
- Desde el modal se pueden realizar las mismas acciones que en Colecciones: editar, copiar, favorito, etc.
- Los botones de editar nombre/eliminar etiqueta siguen funcionando igual (no se ve afectada la funcionalidad existente).

---

### Detalles tecnicos

**Archivo a modificar: `src/pages/Tags.tsx`**

1. Agregar estados nuevos:
   - `viewingTag`: la etiqueta seleccionada (tipo `TagWithUsage | null`).
   - `tagPrompts`: array de prompts cargados para esa etiqueta.
   - `loadingPrompts`: booleano de carga.

2. Funcion `fetchTagPrompts(tagId)`:
   - Consulta a `prompt_tags` filtrando por `tag_id`, haciendo join con `prompts` para obtener los datos completos del prompt.
   - Ordena por fecha descendente.

3. Handler `handleViewTag(tag)`:
   - Asigna la etiqueta al estado `viewingTag`.
   - Llama a `fetchTagPrompts(tag.id)`.

4. Hacer la fila de cada etiqueta clickeable:
   - Agregar `onClick={() => handleViewTag(tag)}` al contenedor de la fila.
   - Asegurar que los clicks en los botones de editar/eliminar/color usen `e.stopPropagation()` para no abrir el modal.
   - Agregar `cursor-pointer` a la fila y un icono `ChevronRight` al final (como en Colecciones).

5. Agregar un `Dialog` al final del componente:
   - Muestra el nombre y color de la etiqueta en el encabezado.
   - Lista los prompts con `PromptCard` (version simplificada, similar a Colecciones).
   - Incluye acciones basicas: toggle favorito, editar texto del prompt.
   - Estado vacio con icono y mensaje descriptivo.

6. Imports adicionales:
   - `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogFooter` de `@/components/ui/dialog`.
   - `ChevronRight` de `lucide-react`.
   - `PromptCard` de `@/components/PromptCard`.
   - `supabase` de `@/integrations/supabase/client`.

**No se requieren cambios en la base de datos** ya que la relacion `prompt_tags` y las politicas RLS necesarias ya existen.

