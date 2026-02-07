

## Pagina de Onboarding para Factoria

### Que es
Una pantalla de bienvenida interactiva que se muestra a los usuarios nuevos despues de registrarse o iniciar sesion por primera vez. Guia al usuario por las funcionalidades principales de la app en 3-4 pasos visuales antes de llevarlo al contenido.

### Flujo del usuario

```text
Registro/Login --> Onboarding (solo primera vez) --> Pagina principal
```

El onboarding se mostrara unicamente la primera vez que el usuario inicia sesion. Se usara una bandera `has_completed_onboarding` en una tabla `profiles` para recordar si ya lo vio.

### Diseno de los pasos (4 pantallas)

1. **Bienvenida** - "Bienvenido a Factoria" con el nombre del usuario y un mensaje motivador sobre gestionar y potenciar sus prompts.

2. **Crea y organiza** - Explica que puede crear prompts, organizarlos en colecciones y categorias, y etiquetarlos.

3. **Chat con IA** - Muestra que puede chatear con IA directamente desde la app para probar y refinar prompts.

4. **Biblioteca publica** - Explica que puede compartir prompts con la comunidad y descubrir los de otros usuarios.

Cada paso tendra:
- Un icono grande representativo
- Un titulo corto
- Una descripcion de 1-2 lineas
- Indicadores de progreso (dots)
- Botones "Siguiente" / "Anterior" / "Empezar" (ultimo paso)
- Opcion de "Saltar" para omitir el onboarding

### Detalles tecnicos

**Nueva tabla `profiles`:**
- `id` (UUID, PK, referencia a `auth.users.id`)
- `has_completed_onboarding` (BOOLEAN, default false)
- `created_at` (TIMESTAMPTZ)
- Politicas RLS: cada usuario solo puede leer/actualizar su propio perfil
- Trigger para crear automaticamente el perfil cuando se registra un nuevo usuario

**Nuevo archivo `src/pages/Onboarding.tsx`:**
- Componente con estado para el paso actual (0-3)
- Animaciones suaves de transicion entre pasos usando CSS transitions
- Diseno responsive (centrado, max-width, adaptado a movil)
- Al completar: actualiza `has_completed_onboarding = true` y redirige a `/`

**Nueva ruta en `src/App.tsx`:**
- Agregar `/onboarding` como ruta protegida

**Modificar `src/pages/Auth.tsx`:**
- Despues de login/registro exitoso, verificar si el perfil tiene `has_completed_onboarding = false`
- Si no ha completado onboarding, redirigir a `/onboarding` en lugar de `/`

**Nuevo hook `src/hooks/useProfile.ts`:**
- Hook para obtener y actualizar el perfil del usuario
- Funcion `completeOnboarding()` que marca el onboarding como completado

### Archivos a crear
- `src/pages/Onboarding.tsx` - Pagina principal del onboarding
- `src/hooks/useProfile.ts` - Hook para gestionar el perfil
- Migracion SQL para la tabla `profiles` con trigger y politicas RLS

### Archivos a modificar
- `src/App.tsx` - Agregar ruta `/onboarding`
- `src/pages/Auth.tsx` - Redirigir a onboarding si es primera vez
- `src/hooks/useAuth.tsx` - Incluir verificacion de perfil en el flujo de auth

### Estilo visual
Siguiendo el diseno minimalista actual de la app:
- Fondo blanco/oscuro segun tema
- Iconos de Lucide grandes y coloridos
- Tipografia limpia
- Card centrada con max-width ~500px (consistente con el resto de la app)
- Dots de progreso en la parte inferior
- Transiciones suaves entre pasos

