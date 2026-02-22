# 11 - Pruebas básicas

## Objetivo
Cubrir con pruebas funcionales los flujos críticos del MVP:
- Auth (login/register/logout)
- RBAC (acceso permitido/denegado)
- Audit logs (registro de eventos)

## Suite implementada
Archivos creados en `tests/functional`:

- `auth.spec.ts`
	- Registro exitoso
	- Login exitoso
	- Logout exitoso

- `rbac.spec.ts`
	- Denegación de acceso sin permiso (`403`)
	- Acceso permitido con permiso (`200`)

- `audit_logs.spec.ts`
	- Registro de `LOGIN`
	- Registro de `LOGIN_FAILED`
	- Registro de `LOGOUT`

## Estrategia de aislamiento
Cada prueba usa transacción global por test:
- `testUtils.db().withGlobalTransaction()`

Esto evita que los datos creados por una prueba contaminen las demás.

## Ejecución
Ejecutar toda la suite:

```bash
node ace test
```

Ejecutar solo funcionales:

```bash
node ace test functional
```

## Requisitos previos
- Migraciones aplicadas
- Base de datos accesible en entorno de pruebas

## Opcional (siguiente iteración)
Agregar pipeline en GitHub Actions para correr `node ace test` en cada push/PR.
