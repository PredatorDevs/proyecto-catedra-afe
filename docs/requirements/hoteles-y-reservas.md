---

## Anexos tecnicos

- Diseno fisico Fase 1 (tablas base): [docs/requirements/fase-1-diseno-fisico-db.md](docs/requirements/fase-1-diseno-fisico-db.md)

---

# Especificación de Requerimientos del Sistema

## Sistema de Reservas y Operación Hotelera

**Versión:** 1.0
**Estado:** Borrador formal consolidado
**Propósito:** Definir de forma clara, verificable y trazable los requerimientos funcionales, reglas de negocio, validaciones, roles, estados y controles del sistema.

---

## 1. Objetivo del sistema

Desarrollar un sistema de reservas y operación hotelera que permita administrar el ciclo completo de hospedaje para reservas individuales, desde la búsqueda y solicitud de disponibilidad hasta el check-out, liquidación, emisión de comprobantes fiscales y control de cargos adicionales, garantizando integridad operativa, seguridad, trazabilidad y control administrativo.

---

## 2. Alcance

El sistema cubrirá las siguientes capacidades:

1. Registro y autenticación de usuarios.
2. Gestión de clientes.
3. Consulta de disponibilidad de habitaciones por fecha, hora, capacidad y tipo.
4. Solicitud y gestión de reservas.
5. Atención de clientes sin reserva previa en recepción.
6. Registro de check-in y check-out.
7. Gestión de habitaciones y sus estados operativos.
8. Registro de cargos adicionales durante la estadía.
9. Registro y control de pagos.
10. Emisión de comprobantes fiscales.
11. Notificaciones por correo electrónico.
12. Reportes operativos y administrativos.
13. Bitácora y auditoría de acciones sensibles.

### 2.1 Alcance incluido

El sistema contemplará:

* reservas en línea
* reservas creadas por recepción
* servicio “walk-in” o “in place”
* pagos en efectivo
* pagos por transferencia
* preparación futura para pagos en línea
* comprobantes de consumidor final y crédito fiscal
* reservas individuales; cada habitación se tratará como una operación independiente, aun cuando varios huéspedes pertenezcan al mismo grupo. 

### 2.2 Alcance excluido en esta versión

No se contemplan en esta fase:

* reservas grupales consolidadas para múltiples habitaciones en una sola operación
* depósito por daños
* recargos automáticos por entrada anticipada o salida tardía
* programa de fidelización
* valoraciones y comentarios
* integración con agencias externas
  Estos puntos podrán considerarse en versiones futuras. 

---

## 3. Definiciones y decisiones de diseño

Para cerrar vacíos funcionales, se establecen las siguientes definiciones:

### 3.1 Reserva

Es el registro de una intención formal de hospedaje para una habitación o tipo de habitación, con fechas y horas de entrada y salida previstas.

### 3.2 Servicio “walk-in” o “in place”

Es una reserva creada directamente por recepción para un cliente que llega sin reserva previa, siempre que exista disponibilidad. Operativamente se tratará como una reserva con origen presencial. 

### 3.3 Cargos adicionales

Son consumos o servicios agregados a la estadía, por ejemplo: bebidas, alimentos, lavandería, sábanas extra, recargo por persona adicional u otros servicios definidos en catálogo.
**Nota:** estos conceptos no se denominarán “sobreventa”; el término correcto para el sistema será **cargos adicionales**.

### 3.4 Gestión de limpieza

La limpieza no se tratará como cargo adicional, sino como parte del flujo operativo de la habitación y su disponibilidad.

### 3.5 Confirmación de reserva

Una reserva solo se considerará confirmada cuando cumpla con la política de pago definida por el hotel.

### 3.6 Moneda e impuestos

La moneda operativa del sistema será USD.
Se aplicará IVA a todos los conceptos y un 5% de impuesto al turismo sobre el costo de alojamiento de habitaciones. 

---

## 4. Actores del sistema y permisos

Los roles definidos para el sistema serán: cliente, recepcionista, ama de llaves, gerente y administrador. Esto está alineado con lo que ya estableciste como base de perfiles. 

## 4.1 Cliente

Podrá:

* registrarse
* iniciar y cerrar sesión
* actualizar su información personal
* consultar disponibilidad
* crear solicitudes de reserva
* consultar sus reservas
* cancelar sus reservas según política
* adjuntar comprobantes de transferencia
* consultar sus comprobantes y pagos

No podrá:

* modificar tarifas
* modificar habitaciones
* aprobar pagos
* anular transacciones
* visualizar reservas ajenas
* cambiar estados operativos del hotel

## 4.2 Recepcionista

Podrá:

* registrar clientes
* crear reservas manuales
* registrar servicio walk-in
* consultar disponibilidad
* registrar check-in y check-out
* registrar pagos en efectivo
* registrar pagos por transferencia reportados por cliente
* agregar cargos adicionales
* emitir comprobantes fiscales según permisos
* reubicar habitaciones cuando proceda
* consultar historial operativo necesario para atención

No podrá:

* modificar políticas globales
* autorizar anulaciones por sí sola
* modificar impuestos
* alterar bitácoras
* editar pagos aprobados
* desbloquear habitaciones de mantenimiento sin autorización

## 4.3 Ama de llaves

Podrá:

* visualizar habitaciones asignadas a operación
* cambiar estado de habitación a sucia, en limpieza, inspeccionada o limpia
* registrar observaciones operativas
* reportar incidencias de habitación

No podrá:

* registrar pagos
* emitir comprobantes
* crear reservas
* ver información fiscal sensible
* modificar tarifas

## 4.4 Gerente

Podrá:

* crear, editar y desactivar habitaciones
* definir tarifas y temporadas
* consultar reportes
* gestionar usuarios operativos
* aprobar excepciones
* autorizar cancelaciones especiales
* autorizar liberaciones administrativas de reservas vencidas
* consultar auditoría operativa

## 4.5 Administrador

Tendrá permisos globales del sistema, incluyendo:

* gestión completa de usuarios, roles y permisos
* parametrización general
* autorización de anulaciones y reversas
* gestión de catálogos e impuestos
* consulta completa de auditoría
* configuración de tiempos de liberación, expiraciones y reglas operativas

### 4.6 Regla de autorización reforzada

Toda acción crítica que requiera “clave de administrador” deberá implementarse como **reautenticación de usuario administrador identificado**, no como clave compartida. Esto es consistente con tu necesidad de autorización administrativa para anulación o reintegro, pero lo fortalece con trazabilidad. 

---

## 5. Entidades del sistema

Se adopta como base el conjunto de entidades propuesto por ti, ampliándolo para cubrir control operativo, auditoría y cargos adicionales. 

## 5.1 Entidades principales

* `users`
* `roles`
* `permissions`
* `customers`
* `room_types`
* `rooms`
* `room_prices`
* `reservations`
* `reservation_guests`
* `payments`
* `payment_methods`
* `payment_transactions`
* `fiscal_documents`

## 5.2 Entidades operativas

* `room_blocks`
* `room_status_history`
* `reservation_status_history`
* `additional_charge_catalog`
* `reservation_charges`
* `checkin_checkout_logs`
* `payment_proofs`
* `seasons`
* `taxes`
* `reservation_price_breakdown`
* `notifications`
* `audit_logs`
* `cashier_shifts`

## 5.3 Propósito resumido

* `customers`: datos del cliente
* `rooms`: inventario físico de habitaciones
* `room_prices`: precios por temporada, promoción o vigencia
* `reservations`: núcleo de la operación
* `payments`: pagos aplicados a reservas o cargos
* `payment_transactions`: referencia externa de transacción bancaria o en línea
* `fiscal_documents`: comprobantes fiscales emitidos
* `reservation_charges`: cargos adicionales durante la estadía
* `audit_logs`: trazabilidad obligatoria

---

## 6. Modelo de estados

## 6.1 Estados de reserva

Se definen los siguientes estados:

* `draft`
* `pending_admin_confirmation`
* `pending_payment`
* `payment_under_review`
* `confirmed`
* `checked_in`
* `checked_out`
* `cancelled`
* `expired`
* `no_show`
* `refund_pending`
* `refunded`

### Reglas de transición

* Una reserva nueva creada por el cliente no podrá nacer como `confirmed`.
* Una reserva con comprobante de transferencia enviado pasará a `payment_under_review`.
* Solo una reserva `confirmed` podrá pasar a `checked_in`.
* Una reserva `checked_in` no podrá ser cancelada; deberá pasar por flujo operativo de salida o regularización.
* Una reserva `expired` no se liberará automáticamente si la política administrativa requiere revisión manual. Esto responde a tu criterio de no liberar por vencimiento sin control, ya que puede existir tolerancia operativa. 

## 6.2 Estados de habitación

* `available_clean`
* `reserved`
* `occupied`
* `dirty`
* `cleaning_in_progress`
* `inspected`
* `blocked`
* `maintenance`
* `out_of_service`

### Reglas de transición

* Tras el check-out, la habitación no volverá automáticamente a disponible.
* Después del check-out deberá pasar por `dirty` o `cleaning_in_progress`.
* Solo una habitación en `available_clean` podrá mostrarse como disponible al cliente.
* Una habitación en `blocked`, `maintenance`, `dirty`, `cleaning_in_progress` o `out_of_service` no podrá reservarse ni ocuparse. Esto coincide con lo que ya definiste. 

## 6.3 Estados de pago

* `pending`
* `reported`
* `under_review`
* `approved`
* `rejected`
* `voided`
* `refund_pending`
* `refunded`

## 6.4 Estados de comprobante fiscal

* `not_issued`
* `pending_issue`
* `issued`
* `voided`
* `credit_note_issued`
* `issue_failed`

---

## 7. Requerimientos funcionales

## 7.1 Gestión de usuarios

### RF-USER-001

El sistema deberá permitir el registro de clientes.

### RF-USER-002

El sistema deberá permitir inicio y cierre de sesión seguros.

### RF-USER-003

El sistema deberá permitir actualización de información personal por parte del usuario.

### RF-USER-004

El sistema deberá administrar perfiles y permisos por rol.

### RF-USER-005

El sistema deberá permitir desactivar usuarios sin eliminar trazabilidad histórica.

---

## 7.2 Búsqueda y disponibilidad

### RF-DISP-001

El sistema deberá permitir búsqueda de habitaciones por:

* fecha y hora de entrada
* fecha y hora de salida
* número de personas
* tipo de habitación

### RF-DISP-002

El sistema deberá mostrar únicamente habitaciones disponibles operativamente.

### RF-DISP-003

El sistema deberá excluir de disponibilidad habitaciones:

* bloqueadas
* en mantenimiento
* sucias
* en proceso de limpieza
* fuera de servicio

### RF-DISP-004

El sistema deberá considerar un tiempo de liberación posterior al check-out, parametrizable entre 0 y N horas. Esto se basa en tu regla de liberar una o dos horas después del check-out, según parámetro. 

### RF-DISP-005

El sistema deberá mostrar detalles de la habitación:

* precio
* capacidad
* descripción
* servicios
* fotografías
* política aplicable

---

## 7.3 Reservas

### RF-RES-001

El sistema deberá permitir crear una solicitud de reserva.

### RF-RES-002

El sistema deberá generar un identificador único por reserva.

### RF-RES-003

El sistema deberá permitir modificar una reserva antes del check-in, según política y permisos.

### RF-RES-004

El sistema deberá permitir cancelar una reserva conforme a las reglas de negocio.

### RF-RES-005

El sistema deberá calcular el costo total de la estancia al momento de la solicitud.

### RF-RES-006

El sistema deberá soportar reservas creadas por recepción para clientes walk-in.

### RF-RES-007

El sistema deberá registrar el origen de la reserva:

* web
* recepción
* teléfono
* otro canal configurado

### RF-RES-008

El sistema deberá permitir que una reserva quede en `pending_payment` antes de consolidarse como confirmada, según tu definición actual. 

### RF-RES-009

El sistema no deberá bloquear permanentemente una habitación mientras la reserva se encuentre solo en solicitud sin pago confirmado, salvo política operativa configurada por administración.
**Decisión técnica propuesta:** mientras no exista pago confirmado, la solicitud podrá mantener disponibilidad a nivel de tipo de habitación o requerirá validación administrativa previa para asignación exacta.

---

## 7.4 Check-in y check-out

### RF-STAY-001

El sistema deberá registrar check-in únicamente para reservas confirmadas o walk-in válidos.

### RF-STAY-002

El sistema deberá registrar fecha y hora real de check-in.

### RF-STAY-003

El sistema deberá registrar fecha y hora real de check-out.

### RF-STAY-004

El check-out deberá disparar el flujo de liberación operativa de la habitación.

### RF-STAY-005

El sistema deberá permitir cambio de habitación durante la estadía con trazabilidad.

### RF-STAY-006

El sistema deberá permitir registrar no-show cuando el cliente no se presente dentro del margen permitido.

---

## 7.5 Cargos adicionales

### RF-CHG-001

El sistema deberá manejar un catálogo de cargos adicionales con precio, vigencia e impuestos.

### RF-CHG-002

El sistema deberá permitir agregar cargos adicionales a una reserva o estadía.

### RF-CHG-003

Cada cargo adicional deberá registrar:

* concepto
* cantidad
* precio unitario
* impuestos
* usuario que lo agregó
* fecha y hora

### RF-CHG-004

Los cargos adicionales deberán liquidarse antes del cierre definitivo de la estadía o quedar regularizados por autorización administrativa.

---

## 7.6 Pagos

### RF-PAY-001

El sistema deberá permitir registrar pagos de la reserva.

### RF-PAY-002

El sistema deberá permitir pagos en efectivo. Esto forma parte explícita de tu definición. 

### RF-PAY-003

El sistema deberá permitir registrar transferencias y adjuntar comprobantes.

### RF-PAY-004

El sistema deberá quedar preparado para integración con pasarela de pago en línea.

### RF-PAY-005

La reserva base deberá pagarse en su totalidad; no se permitirán pagos parciales sobre el hospedaje. Esto responde directamente a tu política actual. 

### RF-PAY-006

El sistema deberá permitir pagos posteriores por cargos adicionales, aun cuando el hospedaje base ya haya sido cancelado. Esto también deriva de tu definición actual. 

### RF-PAY-007

El sistema deberá evitar la aplicación duplicada de un pago y, en caso de detección, deberá permitir proceso de reversión o reintegro con autorización.

### RF-PAY-008

El pago en efectivo deberá registrarse por la recepcionista antes de entregar llaves, tal como indicaste en la operación definida. 

---

## 7.7 Comprobantes fiscales

### RF-FISC-001

El sistema deberá emitir comprobantes fiscales de consumidor final y crédito fiscal.

### RF-FISC-002

El comprobante fiscal deberá generarse al cierre del servicio o según política operativa configurada.

### RF-FISC-003

El sistema deberá distinguir entre conceptos de alojamiento y cargos adicionales para cálculo fiscal.

### RF-FISC-004

Para crédito fiscal, el sistema deberá exigir datos fiscales obligatorios antes de emitir el documento.

### RF-FISC-005

El sistema deberá registrar el vínculo entre pago, reserva y documento fiscal.

---

## 7.8 Administración

### RF-ADM-001

El sistema deberá permitir al gerente y administrador crear, editar y desactivar habitaciones.

### RF-ADM-002

El sistema deberá permitir definir precios por temporada, promociones o vigencias especiales.

### RF-ADM-003

El sistema deberá permitir bloquear habitaciones por mantenimiento o indisponibilidad.

### RF-ADM-004

El sistema deberá generar reportes de ocupación, ingresos, cancelaciones, no-show y cargos adicionales.

### RF-ADM-005

El sistema deberá permitir gestionar usuarios y permisos conforme al rol autorizado.

---

## 7.9 Notificaciones

### RF-NOT-001

El sistema deberá enviar confirmaciones de reserva por correo electrónico.

### RF-NOT-002

El sistema deberá enviar recordatorios previos a la llegada.

### RF-NOT-003

El sistema deberá notificar cancelaciones, cambios relevantes y comprobantes emitidos.

### RF-NOT-004

El sistema deberá registrar el historial de notificaciones enviadas y sus estados.

---

## 8. Reglas de negocio

### RN-001

No se permitirá asignar una habitación a dos reservas activas cuyos rangos de estancia se solapen.

### RN-002

Las fechas y horas de salida deberán ser posteriores a las de entrada.

### RN-003

Una habitación bloqueada no podrá reservarse ni ocuparse presencialmente. Esto ya quedó definido por ti y se adopta sin cambios. 

### RN-004

Una habitación sucia o en proceso de limpieza no deberá mostrarse como disponible. Esto también responde directamente a tu criterio actual. 

### RN-005

Una reserva solo se considerará confirmada tras validación del pago conforme a la política del hotel.

### RN-006

No se permitirán pagos parciales del alojamiento base. 

### RN-007

Una reserva vencida no se liberará automáticamente cuando exista política de retención administrativa; deberá pasar por proceso de decisión. 

### RN-008

Los cargos adicionales deberán provenir de un catálogo parametrizable.

### RN-009

Las anulaciones y reembolsos requerirán autorización de administrador o gerente autorizado.

### RN-010

Las tarifas aplicadas a una reserva confirmada deberán congelarse y no cambiar automáticamente por modificaciones posteriores del catálogo.

### RN-011

El impuesto al turismo del 5% aplicará sobre el componente de alojamiento, no necesariamente sobre todos los cargos adicionales, salvo definición fiscal posterior distinta. Esta es una decisión técnica recomendada para evitar cálculos erróneos a futuro.

### RN-012

Una reserva con check-in realizado no podrá cancelarse mediante flujo estándar.

### RN-013

Toda acción crítica deberá quedar auditada.

---

## 9. Validaciones funcionales y técnicas

### VAL-001

No permitir salida menor o igual a entrada.

### VAL-002

No permitir exceder la capacidad máxima de la habitación.

### VAL-003

No permitir check-in sobre reserva no confirmada.

### VAL-004

No permitir check-out si no existe check-in previo.

### VAL-005

No permitir asignar habitación no disponible operativamente.

### VAL-006

No permitir registrar pago sobre reserva cancelada, anulada o inexistente.

### VAL-007

No permitir editar un pago aprobado; solo podrá anularse o revertirse.

### VAL-008

No permitir eliminar físicamente pagos, reservas, cargos o comprobantes.

### VAL-009

No permitir anular pagos o comprobantes sin registrar motivo.

### VAL-010

No permitir emitir crédito fiscal sin datos fiscales obligatorios.

### VAL-011

No permitir que un cliente consulte información de otro cliente.

### VAL-012

No permitir liberar una habitación sin transición de estados válida.

### VAL-013

No permitir duplicidad de comprobante para el mismo cargo liquidado, salvo flujo de reversa regulada.

---

## 10. Requerimientos no funcionales

## 10.1 Rendimiento

### RNF-001

Las consultas de disponibilidad deberán responder en menos de 3 segundos en condiciones normales.

### RNF-002

El sistema deberá soportar múltiples usuarios concurrentes sin pérdida de integridad de datos.

### RNF-003

Las operaciones críticas deberán ejecutarse con control transaccional.

## 10.2 Seguridad

### RNF-004

Las contraseñas deberán almacenarse de forma cifrada con algoritmo seguro.

### RNF-005

Toda comunicación deberá viajar cifrada mediante HTTPS/TLS.

### RNF-006

El sistema deberá implementar control de acceso basado en roles y permisos.

### RNF-007

Las acciones críticas deberán requerir reautenticación o autorización privilegiada.

### RNF-008

El sistema deberá cumplir prácticas razonables de protección de datos personales.

## 10.3 Disponibilidad y respaldo

### RNF-009

El sistema deberá estar disponible 24/7, salvo ventanas programadas de mantenimiento.

### RNF-010

El sistema deberá generar respaldos automáticos de la información.

### RNF-011

El sistema deberá contemplar procedimientos de restauración y recuperación.

## 10.4 Usabilidad

### RNF-012

La interfaz deberá ser intuitiva, responsive y operable desde móviles y escritorio.

### RNF-013

El sistema deberá reducir pasos innecesarios en recepción para agilizar atención al cliente.

## 10.5 Escalabilidad y mantenibilidad

### RNF-014

El sistema deberá soportar crecimiento en número de habitaciones, usuarios y transacciones.

### RNF-015

La arquitectura deberá permitir actualización de catálogos, impuestos, tarifas y políticas sin afectar datos históricos.

### RNF-016

El sistema deberá estar documentado técnica y funcionalmente.

---

## 11. Auditoría y trazabilidad

El sistema deberá registrar bitácora obligatoria para:

* creación y modificación de reservas
* cambios de estado de reserva
* check-in y check-out
* cambios de estado de habitación
* bloqueos y desbloqueos
* creación y anulación de pagos
* reversas y reembolsos
* emisión y anulación de comprobantes
* cambios de tarifas aplicadas
* autorizaciones administrativas

Cada registro de auditoría deberá guardar:

* usuario
* rol
* fecha y hora
* acción ejecutada
* entidad afectada
* valor anterior
* valor nuevo
* motivo
* referencia transaccional

---

## 12. Casos excepcionales obligatorios

El sistema deberá contemplar al menos los siguientes escenarios:

1. pago duplicado
2. transferencia rechazada
3. reserva vencida pendiente de decisión
4. cliente que llega tarde al check-in
5. no-show
6. habitación dañada antes del ingreso
7. cambio de habitación durante estadía
8. anulación de pago ya emitido fiscalmente
9. salida con cargos pendientes
10. fallo al emitir comprobante
11. cliente walk-in sin disponibilidad
12. intento concurrente de reservar la misma habitación

---

## 13. Riesgos funcionales que esta especificación busca evitar

Este documento se diseña específicamente para cerrar huecos que suelen generar irregularidades, tales como:

* doble reserva por concurrencia
* liberación prematura de habitaciones
* pagos aplicados dos veces
* anulaciones sin responsable identificado
* cambios de tarifa sin trazabilidad
* habitaciones no limpias apareciendo como disponibles
* emisión fiscal sin respaldo consistente
* cargos adicionales sin control de usuario ni fecha

---

## 14. Criterios generales de aceptación del sistema

El sistema se considerará funcionalmente aceptable cuando:

1. no permita reservas solapadas
2. no permita check-in sobre reservas no confirmadas
3. no permita usar habitaciones bloqueadas o sucias como disponibles
4. calcule correctamente subtotal, IVA, impuesto al turismo y total
5. registre pagos y evite duplicidades
6. permita facturar consumidor final y crédito fiscal
7. mantenga trazabilidad completa de anulaciones y excepciones
8. soporte operación tanto de reservas web como de atención en recepción
9. permita liquidar cargos adicionales correctamente
10. mantenga consistencia entre reserva, pago, habitación y documento fiscal

---

## 15. Observaciones finales de diseño

Quedan formalmente adoptadas las siguientes decisiones operativas basadas en tu definición original:

* el sistema manejará reservas y también atención directa a clientes sin reserva previa 
* el check-in y check-out formarán parte del control del ciclo de ocupación 
* la facturación fiscal se generará sobre la estadía y cargos adicionales 
* las reservas serán individuales por habitación 
* el hospedaje base se pagará completo y no admitirá pagos parciales 
* el sistema permitirá pagos en recepción y transferencia 
* el flujo inicial será híbrido: solicitud en línea, validación administrativa y pago posterior en recepción o por comprobante 
* la moneda será USD y se aplicará IVA más 5% de turismo sobre alojamiento 

---
