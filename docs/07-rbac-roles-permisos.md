# 07 - RBAC (Roles y Permisos)

## Objetivo
Implementar control de acceso por roles y permisos para proteger rutas y acciones internas del sistema.

## Alcance implementado
- Tablas RBAC:
	- `roles`
	- `permissions`
	- `user_roles`
	- `role_permissions`
- Modelos y relaciones:
	- `User` ↔ `Role` (many-to-many)
	- `Role` ↔ `Permission` (many-to-many)
- Middleware de permisos:
	- `middleware.permission({ permissions: ['slug.permiso'] })`
- Helpers en usuario:
	- `user.hasPermission('slug')`
	- `user.can('slug')`
- UI condicional:
	- Sidebar muestra enlaces administrativos según permisos

## Archivos clave
- Migración RBAC: `database/migrations/1772050000000_create_rbac_tables.ts`
- Modelo Role: `app/models/role.ts`
- Modelo Permission: `app/models/permission.ts`
- User actualizado: `app/models/user.ts`
- Middleware permission: `app/middleware/permission_middleware.ts`
- Middleware auth compartido: `app/middleware/share_auth_middleware.ts`
- Rutas protegidas: `start/routes.ts`
- Vista admin base: `resources/views/pages/admin/index.edge`

## Seeder base (roles, permisos, usuarios)
Seeders incluidos:
- `database/seeders/01_roles_permissions_seeder.ts`
- `database/seeders/02_initial_users_seeder.ts`
- `database/seeders/03_role_assignments_seeder.ts`

Datos iniciales:
- Roles: `admin`, `user`
- Permisos base: `admin.access`, `users.*`, `roles.*`, `permissions.*`
- Usuarios iniciales:
	- admin: `admin@afe.local` / `Admin12345`
	- user: `user@afe.local` / `User12345`

> Cambiar contraseñas iniciales al primer acceso en entornos reales.

## Ejecución
1. Ejecutar migraciones:

```bash
node ace migration:run
```

2. Ejecutar seeders:

```bash
node ace db:seed
```

3. Probar acceso:
- Iniciar sesión con admin y validar acceso a `/admin`
- Iniciar sesión con user y validar denegación en `/admin`

## Protección de rutas (ejemplo)
```ts
router
	.get('/admin', async ({ view }) => view.render('pages/admin/index'))
	.use(middleware.auth())
	.use(middleware.permission({ permissions: ['admin.access'] }))
	.use(middleware.shareAuth())
```
