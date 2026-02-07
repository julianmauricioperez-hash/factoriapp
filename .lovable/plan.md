

## Contador de prompts en "Mis Prompts"

Se agregara un contador visible que muestre el total de prompts y se actualice dinamicamente al aplicar filtros.

---

### Comportamiento

- Debajo del encabezado "Mis Prompts" y antes de los controles de busqueda/filtro, se mostrara un texto con el conteo.
- **Sin filtros activos**: Muestra el total, por ejemplo: "12 prompts".
- **Con filtros activos**: Muestra cuantos coinciden del total, por ejemplo: "3 de 12 prompts".
- El conteo se actualiza en tiempo real al cambiar cualquier filtro (busqueda, categoria, coleccion, favoritos, etiquetas).
- El texto se presenta de forma compacta y discreta usando el estilo `text-muted-foreground`.

---

### Detalles tecnicos

**Archivo a modificar: `src/pages/MyPrompts.tsx`**

1. Agregar una linea de texto entre el encabezado ("Mis Prompts" + boton Exportar) y los controles de busqueda/filtro (linea ~398).

2. La logica es sencilla, usando los valores que ya existen:
   - `prompts.length` = total de prompts del usuario.
   - `filteredAndSortedPrompts.length` = prompts que coinciden con los filtros activos.
   - Si ambos valores son iguales, mostrar solo el total (ej: "12 prompts").
   - Si son diferentes, mostrar ambos (ej: "3 de 12 prompts").

3. Detectar si hay filtros activos comparando: `searchQuery`, `filterCategory !== "all"`, `filterCollection !== "all"`, `showFavoritesOnly`, o `selectedTagIds.length > 0`.

4. No se requieren estados nuevos ni consultas adicionales a la base de datos; todo se calcula con los datos ya disponibles en memoria.

**No se requieren cambios en la base de datos.**

