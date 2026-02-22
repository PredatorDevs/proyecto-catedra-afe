# 10 - Pantallas mínimas de administración

## Objetivo
Exponer pantallas administrativas básicas protegidas por autenticación y RBAC.

## Alcance implementado
- `/admin` (panel base)
- `/admin/users` (lista básica de usuarios)
- `/admin/roles` (lista básica de roles y permisos)
- `/admin/audit-logs` (consulta de bitácora)

Todas las rutas están protegidas con:
- `middleware.auth()`
- `middleware.permission(...)`
- `middleware.shareAuth()`

## Permisos por ruta
- `/admin` → `admin.access`
- `/admin/users` → `users.read`
- `/admin/roles` → `roles.read`
- `/admin/audit-logs` → `audit_logs.read`

## Archivos clave
- Rutas: `start/routes.ts`
- Controladores admin:
	- `app/controllers/admin/users_controller.ts`
	- `app/controllers/admin/roles_controller.ts`
	- `app/controllers/admin/audit_logs_controller.ts`
- Vistas admin:
	- `resources/views/pages/admin/index.edge`
	- `resources/views/pages/admin/users.edge`
	- `resources/views/pages/admin/roles.edge`
	- `resources/views/pages/admin/audit_logs.edge`
- Navegación condicional por permisos:
	- `resources/views/partials/sidebar.edge`

## Validación rápida
1. Iniciar sesión con admin y verificar acceso a todas las rutas `/admin/*`.
2. Iniciar sesión con usuario estándar y confirmar denegación según permisos.

## Nota
El nombre de este archivo se mantiene por continuidad del repositorio, pero su contenido corresponde al Paso 10 del plan actual.
