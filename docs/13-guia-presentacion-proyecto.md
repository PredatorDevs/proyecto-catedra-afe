# Guia de Presentacion del Proyecto

## Objetivo de esta guia
Este documento te ayuda a presentar el sistema en un orden logico y convincente, mostrando:
- que problema resuelve cada modulo
- como se conectan los CRUD entre si
- por que el flujo operativo debe usarse de esa forma

---

## 1. Estructura recomendada de la exposicion

### 1.1 Apertura (1-2 minutos)
Presenta el objetivo general:
- Sistema de reservas y operacion hotelera
- Control completo del ciclo: reserva -> estadia -> cargos -> pago -> fiscal
- Seguridad y trazabilidad: autenticacion, permisos y auditoria

Mensaje clave para abrir:
"No son CRUD aislados; son eslabones de un flujo operativo que evita errores y mantiene control financiero."

### 1.2 Base tecnica (1 minuto)
Explica brevemente stack y arquitectura:
- AdonisJS + TypeScript + MySQL
- Vistas Edge para panel administrativo
- Validaciones en backend (Vine)
- Auditoria para acciones sensibles

No te extiendas aqui. Solo establece credibilidad tecnica.

### 1.3 Demo funcional por fases (10-18 minutos)
Presenta por capas de dependencia:
1. Seguridad y acceso
2. Catalogos base (Fase 1)
3. Operacion de reservaciones (Fase 2)
4. Pagos, caja y fiscal (Fase 3)
5. Pruebas y cierre

Este orden evita saltos y te permite justificar cada CRUD antes de usarlo.

---

## 2. Orden exacto de presentacion de modulos y CRUD

## 2.1 Seguridad primero
### Que mostrar
- Login
- Roles y permisos (RBAC)
- Bitacora/auditoria

### Por que va primero
- Todo CRUD administrativo depende de permisos.
- Te permite demostrar control y gobierno antes de hablar de operaciones.

### Conexion con el resto
- Usuarios con permiso `admin.access` operan los modulos hoteleros.
- Cada alta/edicion importante deja rastro en auditoria.

---

## 2.2 Fase 1: Catalogos base (maestros)
Presenta estos CRUD en este orden:
1. Tipos de habitacion
2. Habitaciones
3. Precios
4. Clientes
5. (Si aplica) Catalogo de cargos

### Por que este orden
- No puedes crear una habitacion sin tipo.
- No puedes reservar correctamente sin habitaciones y precios.
- No puedes crear reserva sin cliente.

### Relacion conceptual
- room_types -> rooms -> room_prices
- customers -> reservations

Mensaje de transicion:
"Con la base maestra lista, ya podemos operar reservaciones reales."

---

## 2.3 Fase 2: Reservaciones y operacion de estadia
Presenta en este orden:
1. Crear reservacion
2. Huespedes de reservacion
3. Cargos adicionales
4. Check-in / Check-out
5. Cambios de estado de reserva

### Por que este orden
- La reserva es el contenedor operativo.
- Los huespedes y cargos cuelgan de una reserva existente.
- Check-in y check-out dependen del estado de reserva y disponibilidad.

### Reglas que conviene remarcar
- Validaciones de traslape (habitacion/fechas)
- Restriccion de transiciones de estado
- Calculo de totales en reserva

Mensaje de transicion:
"Una vez tenemos consumo y total de la reserva, entramos al bloque financiero y fiscal."

---

## 2.4 Fase 3: Pagos, caja y fiscal (orden recomendado)
Presenta los CRUD en este orden exacto:
1. Metodos de pago
2. Turnos de caja
3. Pagos
4. Comprobantes de pago
5. Transacciones de pago
6. Asignaciones de pago a reservacion
7. Asignaciones de pago a cargos
8. Documentos fiscales

### Por que este orden
- Los pagos necesitan un metodo previamente configurado.
- Si hay efectivo, necesita turno de caja abierto.
- Comprobantes/transacciones son evidencia del pago ya registrado.
- Las asignaciones distribuyen el monto del pago (control de sobreasignacion).
- Fiscal se construye al final, cuando ya tienes montos y contexto del pago.

### Reglas operativas clave a mencionar
- Pagos manuales (sin pasarela en esta fase)
- Metodo que requiere referencia obliga referencia
- Pago en efectivo exige caja abierta
- Transiciones de estado de pago controladas
- Bloqueo de asignaciones duplicadas
- No se permite asignar mas del monto del pago

---

## 3. Como conectar un CRUD con otro durante la demo

Usa este patron narrativo en cada modulo:
1. "Que dato crea este modulo"
2. "Quien consume ese dato despues"
3. "Que riesgo evita la validacion"

Ejemplo rapido (pagos):
- "Aqui creo un metodo de pago con regla de referencia."
- "Ese metodo se usa al registrar pago en reservaciones."
- "La validacion evita pagos incompletos sin referencia cuando el metodo lo exige."

Este formato te ayuda a no sonar como lista de pantallas.

---

## 4. Guion corto sugerido (demo de 12-15 min)

1. Ingreso y permisos
- Entrar al sistema
- Mostrar que el menu admin depende de permisos

2. Base maestra
- Crear tipo de habitacion
- Crear habitacion
- Crear cliente

3. Operacion
- Crear reservacion
- Agregar cargo
- Mostrar estado y total

4. Financiero
- Crear metodo de pago
- Abrir turno de caja (si pago en efectivo)
- Registrar pago
- Aprobar pago
- Mostrar impacto en amountPaid / balanceDue

5. Fiscal
- Crear documento fiscal asociado
- Resaltar snapshots y trazabilidad

6. Cierre
- Mostrar auditoria
- Resumir valor: control operativo + control financiero + trazabilidad

---

## 5. Mapa de dependencias (resumen rapido)

- Seguridad: users/roles/permissions -> habilita acceso a modulos
- Maestros: customers + room_types + rooms + prices -> habilita reservas
- Operacion: reservations -> habilita guests/charges/checkin-checkout
- Finanzas: payment_methods + cashier_shifts -> habilita payments
- Distribucion: payments -> habilita allocations
- Fiscal: reservations + customers + payments -> habilita fiscal_documents

Si te preguntan "que pasa si me salto pasos", responde:
"El sistema lo bloquea por integridad referencial y reglas de negocio, para no tener operaciones huérfanas o montos inconsistentes."

---

## 6. Checklist antes de presentar

- Tener usuario con permisos administrativos
- Tener datos semilla minimos (cliente, habitacion, metodo de pago)
- Verificar que migraciones y pruebas esten en verde
- Preparar un caso feliz y un caso de validacion fallida

Casos fallidos recomendados para demostrar robustez:
- Intentar pago sin referencia con metodo que la exige
- Intentar pago en efectivo sin turno abierto
- Intentar asignacion duplicada de pago-reservacion

---

## 7. Cierre sugerido para la defensa

"El proyecto implementa una arquitectura por fases donde cada CRUD tiene una razon operativa y una dependencia clara. Primero se asegura acceso y trazabilidad, luego se construye la operacion hotelera, y finalmente se controla el flujo financiero y fiscal. Esto reduce errores manuales, mejora auditoria y deja una base lista para crecimiento futuro (notificaciones, reportes avanzados e integraciones)."
