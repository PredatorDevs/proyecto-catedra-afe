# 06 - Auth: Registro, Login y Logout (Session Guard + Edge)

## Objetivo
Implementar autenticación base en `proyecto-catedra-afe` utilizando **AdonisJS Auth con Session Guard**:

- Registro de usuarios
- Login
- Logout
- Redirección/Control de acceso según estado de sesión (guest vs autenticado)
- Protección de rutas internas con middleware `auth`
- Layout dedicado para páginas de autenticación (sin sidebar)
- Validación de formularios con **VineJS**
- Protección CSRF en formularios Edge con `csrfField()`

---

## Componentes implementados (estado final)

### 1) Controller de autenticación
Archivo: `app/controllers/auth_controller.ts`

Responsabilidades:
- Renderizar páginas de login y registro
- Evitar que un usuario ya autenticado vea `/login` o `/register` (redirige a `/dashboard`)
- Procesar POST `/login` con verificación de credenciales
- Procesar POST `/register` creando usuario + login automático
- Procesar POST `/logout` cerrando sesión
