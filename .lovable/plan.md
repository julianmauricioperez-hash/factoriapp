
## Mejorar el formato de las respuestas de IA en el Chat

### Problema
Las respuestas de la IA se ven con el texto "pegado" - sin suficiente espacio entre parrafos, encabezados, listas e ingredientes. Esto ocurre porque se usa la clase `prose-sm` de Tailwind Typography que minimiza el espaciado, y no hay estilos CSS personalizados para el contenido del chat.

### Solucion

**1. Mejorar las clases de Tailwind Typography en `ChatMessages.tsx`**
- Cambiar `prose prose-sm` por `prose` (tamano normal) para dar mas aire al contenido
- Agregar clases utilitarias de prose para mejor espaciado: `prose-headings:font-semibold`, `prose-p:my-2`, `prose-ul:my-2`, `prose-ol:my-2`, `prose-li:my-0.5`
- Aplicar los mismos cambios tanto a los mensajes guardados como al contenido en streaming

**2. Agregar estilos CSS personalizados en `index.css`**
- Crear una clase `.chat-markdown` con reglas especificas para:
  - Espaciado entre parrafos (`p + p { margin-top: 0.75em }`)
  - Margenes en encabezados (`h1-h4` con margen superior e inferior adecuado)
  - Listas con sangria y separacion entre items
  - Negritas bien diferenciadas
  - Bloques de codigo con fondo diferenciado y padding
  - Separadores horizontales (`hr`) con margen visible

### Archivos a modificar

**`src/components/chat/ChatMessages.tsx`**
- Linea 89: Cambiar las clases del contenedor de mensajes del asistente de `prose prose-sm dark:prose-invert max-w-none` a `prose dark:prose-invert max-w-none chat-markdown`
- Linea 141: Aplicar el mismo cambio en el contenedor de streaming

**`src/index.css`**
- Agregar estilos globales para la clase `.chat-markdown` que cubran:
  - Espaciado entre parrafos consecutivos
  - Margenes en encabezados (h1 a h4)
  - Listas ordenadas y desordenadas con sangria
  - Items de lista con separacion
  - Negritas con peso visual adecuado
  - Bloques de codigo inline y en bloque
  - Lineas horizontales

### Resultado esperado
Las respuestas de la IA mostraran un formato limpio con:
- Parrafos claramente separados
- Encabezados con espacio visual
- Listas con sangria y separacion entre items
- Negritas bien visibles (como "Ingredientes:" y "Preparacion:")
- Codigo formateado correctamente si se incluye
