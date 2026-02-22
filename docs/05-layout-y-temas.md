# 05 - Layout base + Modo claro/oscuro persistente (Edge 6 + DaisyUI)

## Objetivo
Implementar el **layout base** del sistema en `proyecto-catedra-afe` con:

- Layout reutilizable (navbar + sidebar + área de contenido)
- Vistas iniciales (Home / Dashboard) usando dicho layout
- Toggle de tema **light/dark** con persistencia (localStorage)
- Rutas iniciales para navegación

Este paso se construyó sobre el Paso 4 (Tailwind + DaisyUI ya funcionando sin CDN).

---

## Contexto importante: AdonisJS 6 / Edge 6
En AdonisJS 6, el motor Edge trabaja muy bien con un patrón de **layout basado en componentes**.  
En este proyecto, el layout se implementó como un componente Edge y se consume desde las páginas con `@component(...)`.

> Nota: Sintaxis tipo Blade/Laravel (`@extends`, `@section`, etc.) no aplica aquí.

---

## Archivos involucrados (estado final)

### Layout (componente)
**`resources/views/components/layouts/app.edge`**  
Define la estructura principal del HTML y expone un *slot principal* para renderizar el contenido de cada página.

Responsabilidades:
- Declarar `<html data-theme="light">` (tema por defecto)
- Cargar assets con Vite: `app.css` + `app.js`
- Incluir `partials/navbar` y `partials/sidebar`
- Renderizar el contenido de cada página vía: `{{{ await $slots.main() }}}`

Contenido actual:

```edge
<!DOCTYPE html>
<html lang="es" data-theme="light">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />

    <title>{{ title || 'proyecto-catedra-afe' }}</title>

    @if ($slots.meta)
      {{{ await $slots.meta() }}}
    @endif

    @vite(['resources/css/app.css', 'resources/js/app.js'])
  </head>

  <body class="min-h-screen bg-base-200">
    @include('partials/navbar')

    <div class="flex">
      @include('partials/sidebar')

      <main class="flex-1 p-6">
        {{{ await $slots.main() }}}
      </main>
    </div>
  </body>
</html>
```