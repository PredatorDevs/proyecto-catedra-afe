# 09 - Seeders y usuario admin inicial

## Objetivo
Estandarizar la carga de datos base para RBAC y acceso inicial de administración.

## Estructura de seeders implementada
Se separó la carga en 3 seeders idempotentes para facilitar mantenimiento y evolución:

1. `database/seeders/01_roles_permissions_seeder.ts`
	- Crea/actualiza roles base (`admin`, `user`)
	- Crea/actualiza permisos base (`admin.access`, `users.*`, `roles.*`, `permissions.*`, `audit_logs.*`)

2. `database/seeders/02_initial_users_seeder.ts`
	- Crea/actualiza usuario admin inicial
	- Crea/actualiza usuario estándar inicial

3. `database/seeders/03_role_assignments_seeder.ts`
	- Asigna todos los permisos al rol `admin`
	- Asigna permisos mínimos al rol `user`
	- Asigna rol `admin` al usuario admin y rol `user` al usuario estándar

## Credenciales iniciales (desarrollo)
- Admin:
  - Email: `admin@afe.local`
  - Password: `Admin12345`
- Usuario estándar:
  - Email: `user@afe.local`
  - Password: `User12345`

> Recomendación: cambiar contraseñas iniciales al primer uso y no usar estas credenciales en producción.

## Ejecución
1. Ejecutar migraciones:

```bash
node ace migration:run
```

2. Ejecutar seeders:

```bash
node ace db:seed
```

3. Validar:
- Iniciar sesión con admin
- Confirmar acceso a rutas administrativas
- Confirmar que usuario estándar no accede a rutas protegidas de admin

## Nota de diseño
La separación por responsabilidades permite extender el sistema con nuevos permisos y roles sin tocar un único seeder monolítico.
