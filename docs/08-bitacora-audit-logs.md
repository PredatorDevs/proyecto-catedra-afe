# 08 - Bitácora parcial (Audit Logs)

## Objetivo
Registrar eventos clave del sistema para trazabilidad operativa y soporte de auditoría básica.

## Alcance implementado
- Tabla `audit_logs` con campos:
	- `user_id`
	- `action`
	- `entity`
	- `entity_id`
	- `ip`
	- `user_agent`
	- `metadata`
	- `created_at`
- Servicio reutilizable de logging (`AuditLogger`)
- Registro de eventos de autenticación:
	- `LOGIN`
	- `LOGIN_FAILED`
	- `LOGOUT`
- Registro de creación de usuario por registro público:
	- `CREATE` sobre entidad `user`
- Vista admin para consultar logs (`/admin/audit-logs`)

## Archivos clave
- Migración: `database/migrations/1772053600000_create_audit_logs_table.ts`
- Modelo: `app/models/audit_log.ts`
- Servicio: `app/services/audit_logger.ts`
- Integración auth: `app/controllers/auth_controller.ts`
- Controlador admin logs: `app/controllers/admin/audit_logs_controller.ts`
- Vista admin logs: `resources/views/pages/admin/audit_logs.edge`
- Ruta protegida: `start/routes.ts`

## Permisos RBAC asociados
Se agregaron permisos:
- `audit_logs.read`
- `audit_logs.manage`

El acceso a la ruta `/admin/audit-logs` requiere `audit_logs.read`.

## Ejecución
1. Ejecutar migraciones:

```bash
node ace migration:run
```

2. Re-ejecutar seeders RBAC para permisos nuevos:

```bash
node ace db:seed
```

3. Validar flujo:
- Login y logout generan entradas en bitácora
- `/admin/audit-logs` muestra los registros más recientes

## Nota MVP
La infraestructura queda lista para ampliar en los próximos pasos con eventos `UPDATE/DELETE` de usuarios, roles y permisos cuando se publiquen sus endpoints administrativos.
