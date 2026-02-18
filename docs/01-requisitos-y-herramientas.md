# 01 - Requisitos y herramientas

## Requisitos del entorno
- Node.js (recomendado >= 20.6)
- npm (u otro package manager)
- Git
- Editor (VS Code recomendado)

## Base de datos
Este template está orientado a **MySQL**.
- Para desarrollo puedes usar MySQL local o remoto.
- Para producción está pensado para AWS RDS (MySQL).

## Convenciones iniciales
- Documentación en `/docs`
- Variables sensibles NO se versionan (`.env` no se sube)
- Se incluye `.env.example` (se creará más adelante con placeholders)

## Comandos útiles
- Levantar dev server:
  - `node ace serve --hmr`
- Crear build:
  - `node ace build`
