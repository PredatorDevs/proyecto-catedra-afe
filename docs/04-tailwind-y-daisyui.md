# 04 - Integración de TailwindCSS + DaisyUI (sin CDN)

## Objetivo
Integrar **TailwindCSS** y **DaisyUI** en el proyecto `proyecto-catedra-afe` usando el pipeline local (Vite/PostCSS), dejando listo:

- Estilos base de Tailwind funcionando (`@tailwind base/components/utilities`)
- Componentes DaisyUI operativos
- Temas `light` y `dark` configurados (base para el Paso 5)
- **Sin uso de CDN** (evitar advertencias en navegador y mantener práctica correcta para producción)

---

## Resultado (estado actual)
✅ Tailwind está funcionando correctamente desde `resources/css/app.css`  
✅ Las directivas `@tailwind` se procesan y no rompen el build  
✅ DaisyUI funciona (se verificó con un botón `btn btn-primary`)  
✅ Se removió `https://cdn.tailwindcss.com` de las vistas/layouts  
✅ Ya no aparece el warning del navegador sobre uso de CDN

---

## 1) Instalación de dependencias

> Nota: Se utilizó instalación local (no CDN). En Windows, si el comando `npx tailwindcss init -p` falló con Tailwind v4, se utilizó Tailwind v3.

Instalación recomendada:

```bash
npm i -D tailwindcss@3.4.17 postcss autoprefixer daisyui
npx tailwindcss init -p
