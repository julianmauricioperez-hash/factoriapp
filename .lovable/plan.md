

## Plan: Landing Page, Búsqueda Avanzada e Import/Export

### Resumen

Tres mejoras principales: (1) rediseñar la landing page con secciones informativas, (2) añadir búsqueda avanzada combinada en la Biblioteca Pública, y (3) agregar importación masiva de prompts.

---

### 1. Landing Page mejorada (`src/pages/Index.tsx`)

Restructurar la página principal para que, además del formulario de crear prompt, incluya secciones informativas debajo:

**Secciones nuevas (componentes en `src/components/landing/`):**

- **HeroSection**: Encabezado principal con tagline, descripción y botones CTA ("Empieza ahora" y "Explorar biblioteca")
- **HowItWorksSection**: 3 pasos con iconos: (1) Escribe tu prompt, (2) Mejóralo con IA, (3) Organiza y comparte
- **UseCasesSection**: 4-6 tarjetas con ejemplos de uso (Marketing, Código, Educación, Escritura creativa, etc.) con prompt de ejemplo en cada una
- **TestimonialsSection**: 3 testimonios estáticos con avatar placeholder, nombre y quote
- **CTASection**: Llamada a la acción final con botón de registro/inicio

**Estructura de la página:**
- Si el usuario NO está logueado: mostrar Hero + Cómo funciona + Casos de uso + Testimonios + CTA
- Si el usuario STA logueado: mostrar el formulario actual de crear prompt (comportamiento actual)

### 2. Búsqueda avanzada en Biblioteca Pública (`src/pages/PublicLibrary.tsx`)

La Biblioteca Pública ya tiene filtros por texto, categoría, tags y orden. Mejoras:

- **Filtro por popularidad**: Añadir rango de likes mínimo (slider o select: "Todos", "5+ likes", "10+ likes", "20+ likes")
- **Filtro por fecha**: Añadir filtro de rango temporal ("Última semana", "Último mes", "Últimos 3 meses", "Todo")
- **Búsqueda combinada**: Ya funciona combinada; solo se añaden los dos filtros nuevos al flujo existente
- **UI**: Añadir los nuevos filtros como selects adicionales en la fila de filtros existente

### 3. Exportar/Importar prompts (`src/pages/MyPrompts.tsx`)

**Exportar** ya existe (JSON y CSV). Mejoras:

- **Importar JSON**: Botón "Importar" junto a "Exportar" que abre un diálogo con:
  - Input de archivo (acepta .json y .csv)
  - Preview de los prompts a importar (cantidad y categorías)
  - Botón de confirmación
  - Inserción masiva vía `supabase.from("prompts").insert([])`
- **Importar CSV**: Parser básico que lee las columnas Categoría y Prompt
- **Componente**: `src/components/ImportPromptsDialog.tsx`

---

### Archivos a crear/modificar

| Archivo | Acción |
|---|---|
| `src/components/landing/HeroSection.tsx` | Crear |
| `src/components/landing/HowItWorksSection.tsx` | Crear |
| `src/components/landing/UseCasesSection.tsx` | Crear |
| `src/components/landing/TestimonialsSection.tsx` | Crear |
| `src/components/landing/CTASection.tsx` | Crear |
| `src/pages/Index.tsx` | Modificar - condicional logged in/out |
| `src/pages/PublicLibrary.tsx` | Modificar - añadir filtros de fecha y popularidad |
| `src/components/ImportPromptsDialog.tsx` | Crear |
| `src/pages/MyPrompts.tsx` | Modificar - añadir botón importar |

No se requieren cambios en la base de datos.

