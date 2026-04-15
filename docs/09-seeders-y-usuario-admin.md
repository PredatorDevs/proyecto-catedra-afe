# 09 - Seeders y usuario admin inicial

## Objetivo
Estandarizar la carga de datos base para RBAC y acceso inicial de administración.

## Estructura de seeders implementada
Se separó la carga en seeders idempotentes para facilitar mantenimiento y evolución:

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

4. `database/seeders/04_payment_methods_seeder.ts`
	- Crea/actualiza métodos de pago base para Fase 3 (`CASH`, `BANK_TRANSFER`, `CARD_MANUAL`)

5. `database/seeders/05_hotels_phase1_catalogs_seeder.ts`
	- Crea/actualiza datos mínimos de Fase 1 para demo:
	  - clientes
	  - tipos de habitación
	  - habitaciones
	  - tarifas base

6. `database/seeders/06_hotels_phase2_demo_reservations_seeder.ts`
	- Crea/actualiza un escenario demo de Fase 2:
	  - reservación de ejemplo
	  - huésped principal
	  - catálogo de cargo adicional demo
	  - cargo de reservación demo

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

### Orden recomendado por propósito
- Para acceso y seguridad mínima: `01`, `02`, `03`
- Para pagos (Fase 3): agregar `04`
- Para demo operativa completa (Fases 1 y 2): agregar `05` y `06`

3. Validar:
- Iniciar sesión con admin
- Confirmar acceso a rutas administrativas
- Confirmar que usuario estándar no accede a rutas protegidas de admin

## Nota de diseño
La separación por responsabilidades permite extender el sistema con nuevos permisos y roles sin tocar un único seeder monolítico.
