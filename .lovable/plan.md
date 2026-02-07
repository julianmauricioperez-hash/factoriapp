

## Cambios en la pagina de inicio

Dos ajustes visuales en la pagina principal (`src/pages/Index.tsx`):

---

### 1. Titulo principal antes de la tarjeta

Se agregara un encabezado centrado encima de la tarjeta del formulario con el texto:

**"Con Factoria puedes transformar un prompt en una version mas clara, potente y orientada a resultados"**

- Se coloca dentro del contenedor existente (`div` con `flex items-center justify-center`), justo antes de la `Card`.
- Se convierte el contenedor en `flex-col` para apilar el titulo y la tarjeta verticalmente.
- Estilo: texto centrado, tamano moderado (`text-lg md:text-xl`), color `text-foreground`, con un margen inferior (`mb-4`) para separarlo de la tarjeta.

---

### 2. Cambiar "Registrar Prompt" por "Optimiza tu prompt"

En el `CardTitle` (linea 136), se reemplaza el texto "Registrar Prompt" por "Optimiza tu prompt".

---

### Detalles tecnicos

**Archivo a modificar:** `src/pages/Index.tsx`

- **Linea 132**: Cambiar el `div` contenedor para usar `flex-col` y agregar el titulo antes de la `Card`.
- **Linea 136**: Reemplazar el texto "Registrar Prompt" por "Optimiza tu prompt".

No se requieren cambios en la base de datos ni en otros archivos.
