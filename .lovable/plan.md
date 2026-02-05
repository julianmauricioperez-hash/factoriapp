

## Plan: App de Registro de Prompts

Vamos a crear una aplicación minimalista y profesional para registrar prompts con almacenamiento en base de datos.

### 🎨 Diseño
- **Estilo visual**: Fondo blanco, bordes suaves, tipografía limpia
- **Layout**: Formulario centrado en la pantalla, máximo 500px de ancho
- **Responsive**: Se adapta perfectamente a móvil, tablet y escritorio

### 📝 Formulario
- **Campo Categoría**: Dropdown con opciones predefinidas:
  - Creatividad
  - Código / Programación
  - Escritura
  - Marketing
  - Educación
  - Análisis de datos
  - Otra

- **Campo Prompt**: Área de texto amplia para escribir el prompt

- **Botón Enviar**: Estilo limpio y minimalista

### ✅ Mensaje de confirmación
- Después de enviar, aparece un mensaje elegante: **"¡Gracias por alimentar la IA!"**
- El formulario se limpia automáticamente para permitir registrar más prompts

### 💾 Base de datos (Lovable Cloud)
- Tabla `prompts` con campos:
  - Categoría
  - Texto del prompt
  - Fecha de creación

