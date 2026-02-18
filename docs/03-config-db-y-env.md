# 03 - Configuración de Base de Datos (MySQL RDS) y Variables de Entorno

## Objetivo
Configurar el proyecto `proyecto-catedra-afe` para conectarse a una base MySQL en AWS RDS usando variables de entorno.

## 1) Verificar variables requeridas
Revisar el archivo:
- `start/env.ts`

Identificar las variables esperadas para MySQL (por ejemplo: `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DB_NAME`).

## 2) Configurar `.env` (NO se versiona)
Completar en `.env` con credenciales reales del RDS:

```env
DB_CONNECTION=mysql
MYSQL_HOST=REPLACE_ME
MYSQL_PORT=3306
MYSQL_USER=REPLACE_ME
MYSQL_PASSWORD=REPLACE_ME
MYSQL_DB_NAME=REPLACE_ME
