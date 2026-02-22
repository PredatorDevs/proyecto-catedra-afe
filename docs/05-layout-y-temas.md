# 05 - Layout base + Modo claro/oscuro persistente (Edge 6 + DaisyUI)

## Objetivo
Implementar el layout base del sistema en `proyecto-catedra-afe` con:

- Layout reutilizable (navbar + sidebar + área de contenido)
- Integración de assets (Tailwind/DaisyUI + JS) desde Vite
- Toggle de tema `light/dark` con persistencia (localStorage)
- Compartición de usuario autenticado en vistas (`authUser`) para UI condicional
- Rutas base para Home y Dashboard

---

## Estructura final implementada

### Layout componente (Edge)
Se implementó un layout como componente en:

- `resources/views/components/layouts/app.edge`

Este layout:
- Define el documento HTML completo.
- Inicializa `data-theme="light"` en `<html>`.
- Permite un slot opcional `meta` en el `<head>`.
- Incluye los partials `navbar` y `sidebar`.
- Renderiza el contenido principal con el slot `main`.
- Carga assets con Vite (`app.css` y `app.js`).
