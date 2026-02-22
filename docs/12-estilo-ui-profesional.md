# 12 - Estilo UI profesional (Tailwind + DaisyUI)

## Objetivo
Definir un baseline visual consistente y profesional para todo el proyecto usando únicamente utilidades de Tailwind y componentes/tokens de DaisyUI.

## Tema base recomendado
- Tema claro: `corporate`
- Tema oscuro: `dark`

Configuración aplicada en:
- `tailwind.config.js`
- `resources/js/app.js`
- layouts con `data-theme="corporate"`

## Reglas de estilo (equipo)

### 1) Estructura de página
- Cada vista debe usar contenedor vertical: `page-stack`.
- El título principal usa `page-title`.
- El texto descriptivo debajo del título usa `page-subtitle`.

### 2) Superficies y tarjetas
- Toda sección principal se renderiza con:
  - `surface-card`
  - `surface-card-body`
- Evitar mezclar `shadow` fuertes y bordes custom; usar `border-base-300` + `shadow-sm`.

### 3) Formularios
- Inputs con `input input-bordered w-full`.
- Botón primario de acción: `btn btn-primary`.
- Acción secundaria: `btn btn-outline`.
- Errores de validación con `input-error` y `text-error`.

### 4) Tablas administrativas
- Usar siempre `table table-zebra`.
- Envolver en contenedor con `overflow-x-auto`.
- Estados vacíos con texto `text-base-content opacity-70`.

### 5) Navegación
- Sidebar: `menu rounded-box`.
- Navbar con padding responsive (`px-4 md:px-6`) y alineación centrada de controles.

### 6) Espaciado
- Regla general entre bloques: `space-y-6`.
- Evitar márgenes arbitrarios grandes (`mt-12`, etc.) salvo necesidad real.

## Componentes utilitarios definidos
En `resources/css/app.css`:
- `.page-stack`
- `.surface-card`
- `.surface-card-body`
- `.page-title`
- `.page-subtitle`

Estas clases son el estándar para nuevas vistas.

## Checklist para nuevas pantallas
- ¿Usa `page-stack`?
- ¿Tiene `page-title` + `page-subtitle`?
- ¿Está envuelta en `surface-card`?
- ¿Respeta botones `primary/outline`?
- ¿No usa colores hardcodeados?
- ¿Mantiene tokens DaisyUI (`base-*`, `primary`, `error`, etc.)?
