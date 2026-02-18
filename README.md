# AdonisJS Proyecto Cátedra AFE (Web + MySQL) + Tailwind + DaisyUI

Starter template para proyectos empresariales en JavaScript usando **AdonisJS (full-stack)**.
Incluye (en construcción por etapas): layout base, modo claro/oscuro, registro/login, RBAC y bitácora parcial.

## Stack
- AdonisJS (Web kit)
- MySQL (pensado para AWS RDS)
- TailwindCSS + DaisyUI (UI + themes)
- RBAC + Audit Logs (implementación propia)

## Requisitos
- Node.js >= 20.6 (recomendado)
- npm (o pnpm/yarn si decides cambiar)
- Acceso a una base MySQL (RDS) o una local para desarrollo

## Levantar el proyecto (dev)
```bash
npm install
node ace serve --hmr
