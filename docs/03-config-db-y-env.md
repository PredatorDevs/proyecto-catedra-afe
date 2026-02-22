# 03 - Configuración de Base de Datos (MySQL RDS) y Variables de Entorno

## Objetivo
Configurar el proyecto `proyecto-catedra-afe` para conectarse a una base MySQL en AWS RDS usando variables de entorno.

## 1) Verificar variables requeridas
Revisar el archivo:
- `start/env.ts`

Variables esperadas actualmente por el proyecto:

- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_DATABASE`

## 2) Configurar `.env` (NO se versiona)
Completar en `.env` con credenciales reales del RDS:

```env
DB_HOST=REPLACE_ME
DB_PORT=3306
DB_USER=REPLACE_ME
DB_PASSWORD=REPLACE_ME
DB_DATABASE=REPLACE_ME
```

> Nota: En esta plantilla la conexión activa ya está definida en `config/database.ts` como `mysql`, por eso no se requiere `DB_CONNECTION` en `start/env.ts`.

## 3) Archivo de referencia para equipo
Usar `.env.example` con placeholders seguros para compartir la estructura de variables sin exponer secretos.
