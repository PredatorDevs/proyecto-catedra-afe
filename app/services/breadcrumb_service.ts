import router from '@adonisjs/core/services/router'

export type BreadcrumbItem = {
  label: string
  href?: string
  current?: boolean
}

type BreadcrumbDefinitionItem = {
  label: string
  href?: string
  routeName?: string
}

type BreadcrumbDefinition = BreadcrumbDefinitionItem[]

const ROOT_LABEL = 'Inicio'

function normalizePath(path: string) {
  const cleanPath = path.split('?')[0].trim()

  if (!cleanPath || cleanPath === '/') {
    return '/'
  }

  return cleanPath.endsWith('/') ? cleanPath.slice(0, -1) : cleanPath
}

function finalize(items: BreadcrumbItem[]) {
  return items.map((item, index) => {
    const isCurrent = index === items.length - 1

    return {
      ...item,
      href: isCurrent ? undefined : item.href,
      current: isCurrent,
    }
  })
}

function resolveHref(item: BreadcrumbDefinitionItem) {
  if (item.href) {
    return item.href
  }

  if (!item.routeName) {
    return undefined
  }

  try {
    return router.makeUrl(item.routeName)
  } catch {
    return undefined
  }
}

function finalizeDefinition(items: BreadcrumbDefinition) {
  return finalize(
    items.map((item) => ({
      label: item.label,
      href: resolveHref(item),
    }))
  )
}

const namedBreadcrumbs: Record<string, BreadcrumbDefinition> = {
  home: [{ label: ROOT_LABEL, routeName: 'home' }],
  dashboard: [
    { label: ROOT_LABEL, routeName: 'home' },
    { label: 'Dashboard', routeName: 'dashboard' },
  ],
  'admin.index': [
    { label: ROOT_LABEL, routeName: 'home' },
    { label: 'Administracion', routeName: 'admin.index' },
  ],
  'admin.users.index': [
    { label: ROOT_LABEL, routeName: 'home' },
    { label: 'Administracion', routeName: 'admin.index' },
    { label: 'Usuarios', routeName: 'admin.users.index' },
  ],
  'admin.users.create': [
    { label: ROOT_LABEL, routeName: 'home' },
    { label: 'Administracion', routeName: 'admin.index' },
    { label: 'Usuarios', routeName: 'admin.users.index' },
    { label: 'Nuevo usuario' },
  ],
  'admin.users.edit': [
    { label: ROOT_LABEL, routeName: 'home' },
    { label: 'Administracion', routeName: 'admin.index' },
    { label: 'Usuarios', routeName: 'admin.users.index' },
    { label: 'Editar usuario' },
  ],
  'admin.roles.index': [
    { label: ROOT_LABEL, routeName: 'home' },
    { label: 'Administracion', routeName: 'admin.index' },
    { label: 'Roles', routeName: 'admin.roles.index' },
  ],
  'admin.roles.create': [
    { label: ROOT_LABEL, routeName: 'home' },
    { label: 'Administracion', routeName: 'admin.index' },
    { label: 'Roles', routeName: 'admin.roles.index' },
    { label: 'Nuevo rol' },
  ],
  'admin.roles.edit': [
    { label: ROOT_LABEL, routeName: 'home' },
    { label: 'Administracion', routeName: 'admin.index' },
    { label: 'Roles', routeName: 'admin.roles.index' },
    { label: 'Editar rol' },
  ],
  'admin.roles.permissions.edit': [
    { label: ROOT_LABEL, routeName: 'home' },
    { label: 'Administracion', routeName: 'admin.index' },
    { label: 'Roles', routeName: 'admin.roles.index' },
    { label: 'Permisos del Rol' },
  ],
  'admin.permissions.index': [
    { label: ROOT_LABEL, routeName: 'home' },
    { label: 'Administracion', routeName: 'admin.index' },
    { label: 'Permisos', routeName: 'admin.permissions.index' },
  ],
  'admin.permissions.create': [
    { label: ROOT_LABEL, routeName: 'home' },
    { label: 'Administracion', routeName: 'admin.index' },
    { label: 'Permisos', routeName: 'admin.permissions.index' },
    { label: 'Nuevo permiso' },
  ],
  'admin.permissions.edit': [
    { label: ROOT_LABEL, routeName: 'home' },
    { label: 'Administracion', routeName: 'admin.index' },
    { label: 'Permisos', routeName: 'admin.permissions.index' },
    { label: 'Editar permiso' },
  ],
  'admin.auditLogs.index': [
    { label: ROOT_LABEL, routeName: 'home' },
    { label: 'Administracion', routeName: 'admin.index' },
    { label: 'Audit Logs', routeName: 'admin.auditLogs.index' },
  ],
  'admin.hotels.index': [
    { label: ROOT_LABEL, routeName: 'home' },
    { label: 'Administracion', routeName: 'admin.index' },
    { label: 'Hoteles', routeName: 'admin.hotels.index' },
  ],
  'admin.hotels.customers.index': [
    { label: ROOT_LABEL, routeName: 'home' },
    { label: 'Administracion', routeName: 'admin.index' },
    { label: 'Hoteles', routeName: 'admin.hotels.index' },
    { label: 'Clientes', routeName: 'admin.hotels.customers.index' },
  ],
  'admin.hotels.customers.create': [
    { label: ROOT_LABEL, routeName: 'home' },
    { label: 'Administracion', routeName: 'admin.index' },
    { label: 'Hoteles', routeName: 'admin.hotels.index' },
    { label: 'Clientes', routeName: 'admin.hotels.customers.index' },
    { label: 'Nuevo cliente' },
  ],
  'admin.hotels.customers.edit': [
    { label: ROOT_LABEL, routeName: 'home' },
    { label: 'Administracion', routeName: 'admin.index' },
    { label: 'Hoteles', routeName: 'admin.hotels.index' },
    { label: 'Clientes', routeName: 'admin.hotels.customers.index' },
    { label: 'Editar cliente' },
  ],
  'admin.hotels.roomTypes.index': [
    { label: ROOT_LABEL, routeName: 'home' },
    { label: 'Administracion', routeName: 'admin.index' },
    { label: 'Hoteles', routeName: 'admin.hotels.index' },
    { label: 'Tipos de habitacion', routeName: 'admin.hotels.roomTypes.index' },
  ],
  'admin.hotels.roomTypes.create': [
    { label: ROOT_LABEL, routeName: 'home' },
    { label: 'Administracion', routeName: 'admin.index' },
    { label: 'Hoteles', routeName: 'admin.hotels.index' },
    { label: 'Tipos de habitacion', routeName: 'admin.hotels.roomTypes.index' },
    { label: 'Nuevo tipo' },
  ],
  'admin.hotels.roomTypes.edit': [
    { label: ROOT_LABEL, routeName: 'home' },
    { label: 'Administracion', routeName: 'admin.index' },
    { label: 'Hoteles', routeName: 'admin.hotels.index' },
    { label: 'Tipos de habitacion', routeName: 'admin.hotels.roomTypes.index' },
    { label: 'Editar tipo' },
  ],
  'admin.hotels.rooms.index': [
    { label: ROOT_LABEL, routeName: 'home' },
    { label: 'Administracion', routeName: 'admin.index' },
    { label: 'Hoteles', routeName: 'admin.hotels.index' },
    { label: 'Habitaciones', routeName: 'admin.hotels.rooms.index' },
  ],
  'admin.hotels.rooms.create': [
    { label: ROOT_LABEL, routeName: 'home' },
    { label: 'Administracion', routeName: 'admin.index' },
    { label: 'Hoteles', routeName: 'admin.hotels.index' },
    { label: 'Habitaciones', routeName: 'admin.hotels.rooms.index' },
    { label: 'Nueva habitacion' },
  ],
  'admin.hotels.rooms.edit': [
    { label: ROOT_LABEL, routeName: 'home' },
    { label: 'Administracion', routeName: 'admin.index' },
    { label: 'Hoteles', routeName: 'admin.hotels.index' },
    { label: 'Habitaciones', routeName: 'admin.hotels.rooms.index' },
    { label: 'Editar habitacion' },
  ],
  'admin.hotels.roomImages.index': [
    { label: ROOT_LABEL, routeName: 'home' },
    { label: 'Administracion', routeName: 'admin.index' },
    { label: 'Hoteles', routeName: 'admin.hotels.index' },
    { label: 'Imagenes', routeName: 'admin.hotels.roomImages.index' },
  ],
  'admin.hotels.roomImages.create': [
    { label: ROOT_LABEL, routeName: 'home' },
    { label: 'Administracion', routeName: 'admin.index' },
    { label: 'Hoteles', routeName: 'admin.hotels.index' },
    { label: 'Imagenes', routeName: 'admin.hotels.roomImages.index' },
    { label: 'Nueva imagen' },
  ],
  'admin.hotels.roomImages.edit': [
    { label: ROOT_LABEL, routeName: 'home' },
    { label: 'Administracion', routeName: 'admin.index' },
    { label: 'Hoteles', routeName: 'admin.hotels.index' },
    { label: 'Imagenes', routeName: 'admin.hotels.roomImages.index' },
    { label: 'Editar imagen' },
  ],
  'admin.hotels.seasons.index': [
    { label: ROOT_LABEL, routeName: 'home' },
    { label: 'Administracion', routeName: 'admin.index' },
    { label: 'Hoteles', routeName: 'admin.hotels.index' },
    { label: 'Temporadas', routeName: 'admin.hotels.seasons.index' },
  ],
  'admin.hotels.seasons.create': [
    { label: ROOT_LABEL, routeName: 'home' },
    { label: 'Administracion', routeName: 'admin.index' },
    { label: 'Hoteles', routeName: 'admin.hotels.index' },
    { label: 'Temporadas', routeName: 'admin.hotels.seasons.index' },
    { label: 'Nueva temporada' },
  ],
  'admin.hotels.seasons.edit': [
    { label: ROOT_LABEL, routeName: 'home' },
    { label: 'Administracion', routeName: 'admin.index' },
    { label: 'Hoteles', routeName: 'admin.hotels.index' },
    { label: 'Temporadas', routeName: 'admin.hotels.seasons.index' },
    { label: 'Editar temporada' },
  ],
  'admin.hotels.roomPrices.index': [
    { label: ROOT_LABEL, routeName: 'home' },
    { label: 'Administracion', routeName: 'admin.index' },
    { label: 'Hoteles', routeName: 'admin.hotels.index' },
    { label: 'Tarifas', routeName: 'admin.hotels.roomPrices.index' },
  ],
  'admin.hotels.roomPrices.create': [
    { label: ROOT_LABEL, routeName: 'home' },
    { label: 'Administracion', routeName: 'admin.index' },
    { label: 'Hoteles', routeName: 'admin.hotels.index' },
    { label: 'Tarifas', routeName: 'admin.hotels.roomPrices.index' },
    { label: 'Nueva tarifa' },
  ],
  'admin.hotels.roomPrices.edit': [
    { label: ROOT_LABEL, routeName: 'home' },
    { label: 'Administracion', routeName: 'admin.index' },
    { label: 'Hoteles', routeName: 'admin.hotels.index' },
    { label: 'Tarifas', routeName: 'admin.hotels.roomPrices.index' },
    { label: 'Editar tarifa' },
  ],
  'admin.hotels.additionalCharges.index': [
    { label: ROOT_LABEL, routeName: 'home' },
    { label: 'Administracion', routeName: 'admin.index' },
    { label: 'Hoteles', routeName: 'admin.hotels.index' },
    { label: 'Cargos adicionales', routeName: 'admin.hotels.additionalCharges.index' },
  ],
  'admin.hotels.additionalCharges.create': [
    { label: ROOT_LABEL, routeName: 'home' },
    { label: 'Administracion', routeName: 'admin.index' },
    { label: 'Hoteles', routeName: 'admin.hotels.index' },
    { label: 'Cargos adicionales', routeName: 'admin.hotels.additionalCharges.index' },
    { label: 'Nuevo cargo' },
  ],
  'admin.hotels.additionalCharges.edit': [
    { label: ROOT_LABEL, routeName: 'home' },
    { label: 'Administracion', routeName: 'admin.index' },
    { label: 'Hoteles', routeName: 'admin.hotels.index' },
    { label: 'Cargos adicionales', routeName: 'admin.hotels.additionalCharges.index' },
    { label: 'Editar cargo' },
  ],
  'admin.hotels.reservations.index': [
    { label: ROOT_LABEL, routeName: 'home' },
    { label: 'Administracion', routeName: 'admin.index' },
    { label: 'Hoteles', routeName: 'admin.hotels.index' },
    { label: 'Reservaciones', routeName: 'admin.hotels.reservations.index' },
  ],
  'admin.hotels.reservations.create': [
    { label: ROOT_LABEL, routeName: 'home' },
    { label: 'Administracion', routeName: 'admin.index' },
    { label: 'Hoteles', routeName: 'admin.hotels.index' },
    { label: 'Reservaciones', routeName: 'admin.hotels.reservations.index' },
    { label: 'Nueva reservacion' },
  ],
  'admin.hotels.reservations.edit': [
    { label: ROOT_LABEL, routeName: 'home' },
    { label: 'Administracion', routeName: 'admin.index' },
    { label: 'Hoteles', routeName: 'admin.hotels.index' },
    { label: 'Reservaciones', routeName: 'admin.hotels.reservations.index' },
    { label: 'Editar reservacion' },
  ],
  'admin.hotels.reservationGuests.index': [
    { label: ROOT_LABEL, routeName: 'home' },
    { label: 'Administracion', routeName: 'admin.index' },
    { label: 'Hoteles', routeName: 'admin.hotels.index' },
    { label: 'Huespedes de reservacion', routeName: 'admin.hotels.reservationGuests.index' },
  ],
  'admin.hotels.reservationGuests.create': [
    { label: ROOT_LABEL, routeName: 'home' },
    { label: 'Administracion', routeName: 'admin.index' },
    { label: 'Hoteles', routeName: 'admin.hotels.index' },
    { label: 'Huespedes de reservacion', routeName: 'admin.hotels.reservationGuests.index' },
    { label: 'Nuevo huesped' },
  ],
  'admin.hotels.reservationGuests.edit': [
    { label: ROOT_LABEL, routeName: 'home' },
    { label: 'Administracion', routeName: 'admin.index' },
    { label: 'Hoteles', routeName: 'admin.hotels.index' },
    { label: 'Huespedes de reservacion', routeName: 'admin.hotels.reservationGuests.index' },
    { label: 'Editar huesped' },
  ],
  'admin.hotels.checkinCheckoutLogs.index': [
    { label: ROOT_LABEL, routeName: 'home' },
    { label: 'Administracion', routeName: 'admin.index' },
    { label: 'Hoteles', routeName: 'admin.hotels.index' },
    { label: 'Logs check-in/check-out', routeName: 'admin.hotels.checkinCheckoutLogs.index' },
  ],
  'admin.hotels.checkinCheckoutLogs.create': [
    { label: ROOT_LABEL, routeName: 'home' },
    { label: 'Administracion', routeName: 'admin.index' },
    { label: 'Hoteles', routeName: 'admin.hotels.index' },
    { label: 'Logs check-in/check-out', routeName: 'admin.hotels.checkinCheckoutLogs.index' },
    { label: 'Nuevo log' },
  ],
  'admin.hotels.checkinCheckoutLogs.edit': [
    { label: ROOT_LABEL, routeName: 'home' },
    { label: 'Administracion', routeName: 'admin.index' },
    { label: 'Hoteles', routeName: 'admin.hotels.index' },
    { label: 'Logs check-in/check-out', routeName: 'admin.hotels.checkinCheckoutLogs.index' },
    { label: 'Editar log' },
  ],
  'admin.hotels.reservationCharges.index': [
    { label: ROOT_LABEL, routeName: 'home' },
    { label: 'Administracion', routeName: 'admin.index' },
    { label: 'Hoteles', routeName: 'admin.hotels.index' },
    { label: 'Cargos de reservacion', routeName: 'admin.hotels.reservationCharges.index' },
  ],
  'admin.hotels.reservationCharges.create': [
    { label: ROOT_LABEL, routeName: 'home' },
    { label: 'Administracion', routeName: 'admin.index' },
    { label: 'Hoteles', routeName: 'admin.hotels.index' },
    { label: 'Cargos de reservacion', routeName: 'admin.hotels.reservationCharges.index' },
    { label: 'Nuevo cargo' },
  ],
  'admin.hotels.reservationCharges.edit': [
    { label: ROOT_LABEL, routeName: 'home' },
    { label: 'Administracion', routeName: 'admin.index' },
    { label: 'Hoteles', routeName: 'admin.hotels.index' },
    { label: 'Cargos de reservacion', routeName: 'admin.hotels.reservationCharges.index' },
    { label: 'Editar cargo' },
  ],
  'admin.hotels.paymentMethods.index': [
    { label: ROOT_LABEL, routeName: 'home' },
    { label: 'Administracion', routeName: 'admin.index' },
    { label: 'Hoteles', routeName: 'admin.hotels.index' },
    { label: 'Metodos de pago', routeName: 'admin.hotels.paymentMethods.index' },
  ],
  'admin.hotels.paymentMethods.create': [
    { label: ROOT_LABEL, routeName: 'home' },
    { label: 'Administracion', routeName: 'admin.index' },
    { label: 'Hoteles', routeName: 'admin.hotels.index' },
    { label: 'Metodos de pago', routeName: 'admin.hotels.paymentMethods.index' },
    { label: 'Nuevo metodo' },
  ],
  'admin.hotels.paymentMethods.edit': [
    { label: ROOT_LABEL, routeName: 'home' },
    { label: 'Administracion', routeName: 'admin.index' },
    { label: 'Hoteles', routeName: 'admin.hotels.index' },
    { label: 'Metodos de pago', routeName: 'admin.hotels.paymentMethods.index' },
    { label: 'Editar metodo' },
  ],
  'admin.hotels.cashierShifts.index': [
    { label: ROOT_LABEL, routeName: 'home' },
    { label: 'Administracion', routeName: 'admin.index' },
    { label: 'Hoteles', routeName: 'admin.hotels.index' },
    { label: 'Turnos de caja', routeName: 'admin.hotels.cashierShifts.index' },
  ],
  'admin.hotels.cashierShifts.create': [
    { label: ROOT_LABEL, routeName: 'home' },
    { label: 'Administracion', routeName: 'admin.index' },
    { label: 'Hoteles', routeName: 'admin.hotels.index' },
    { label: 'Turnos de caja', routeName: 'admin.hotels.cashierShifts.index' },
    { label: 'Nuevo turno' },
  ],
  'admin.hotels.cashierShifts.edit': [
    { label: ROOT_LABEL, routeName: 'home' },
    { label: 'Administracion', routeName: 'admin.index' },
    { label: 'Hoteles', routeName: 'admin.hotels.index' },
    { label: 'Turnos de caja', routeName: 'admin.hotels.cashierShifts.index' },
    { label: 'Editar turno' },
  ],
  'admin.hotels.payments.index': [
    { label: ROOT_LABEL, routeName: 'home' },
    { label: 'Administracion', routeName: 'admin.index' },
    { label: 'Hoteles', routeName: 'admin.hotels.index' },
    { label: 'Pagos', routeName: 'admin.hotels.payments.index' },
  ],
  'admin.hotels.payments.create': [
    { label: ROOT_LABEL, routeName: 'home' },
    { label: 'Administracion', routeName: 'admin.index' },
    { label: 'Hoteles', routeName: 'admin.hotels.index' },
    { label: 'Pagos', routeName: 'admin.hotels.payments.index' },
    { label: 'Nuevo pago' },
  ],
  'admin.hotels.payments.edit': [
    { label: ROOT_LABEL, routeName: 'home' },
    { label: 'Administracion', routeName: 'admin.index' },
    { label: 'Hoteles', routeName: 'admin.hotels.index' },
    { label: 'Pagos', routeName: 'admin.hotels.payments.index' },
    { label: 'Editar pago' },
  ],
  'admin.hotels.fiscalDocuments.index': [
    { label: ROOT_LABEL, routeName: 'home' },
    { label: 'Administracion', routeName: 'admin.index' },
    { label: 'Hoteles', routeName: 'admin.hotels.index' },
    { label: 'Documentos fiscales', routeName: 'admin.hotels.fiscalDocuments.index' },
  ],
  'admin.hotels.fiscalDocuments.create': [
    { label: ROOT_LABEL, routeName: 'home' },
    { label: 'Administracion', routeName: 'admin.index' },
    { label: 'Hoteles', routeName: 'admin.hotels.index' },
    { label: 'Documentos fiscales', routeName: 'admin.hotels.fiscalDocuments.index' },
    { label: 'Nuevo documento' },
  ],
  'admin.hotels.fiscalDocuments.edit': [
    { label: ROOT_LABEL, routeName: 'home' },
    { label: 'Administracion', routeName: 'admin.index' },
    { label: 'Hoteles', routeName: 'admin.hotels.index' },
    { label: 'Documentos fiscales', routeName: 'admin.hotels.fiscalDocuments.index' },
    { label: 'Editar documento' },
  ],
  'admin.hotels.paymentProofs.index': [
    { label: ROOT_LABEL, routeName: 'home' },
    { label: 'Administracion', routeName: 'admin.index' },
    { label: 'Hoteles', routeName: 'admin.hotels.index' },
    { label: 'Comprobantes de pago', routeName: 'admin.hotels.paymentProofs.index' },
  ],
  'admin.hotels.paymentProofs.create': [
    { label: ROOT_LABEL, routeName: 'home' },
    { label: 'Administracion', routeName: 'admin.index' },
    { label: 'Hoteles', routeName: 'admin.hotels.index' },
    { label: 'Comprobantes de pago', routeName: 'admin.hotels.paymentProofs.index' },
    { label: 'Nuevo comprobante' },
  ],
  'admin.hotels.paymentProofs.edit': [
    { label: ROOT_LABEL, routeName: 'home' },
    { label: 'Administracion', routeName: 'admin.index' },
    { label: 'Hoteles', routeName: 'admin.hotels.index' },
    { label: 'Comprobantes de pago', routeName: 'admin.hotels.paymentProofs.index' },
    { label: 'Editar comprobante' },
  ],
  'admin.hotels.paymentTransactions.index': [
    { label: ROOT_LABEL, routeName: 'home' },
    { label: 'Administracion', routeName: 'admin.index' },
    { label: 'Hoteles', routeName: 'admin.hotels.index' },
    { label: 'Transacciones de pago', routeName: 'admin.hotels.paymentTransactions.index' },
  ],
  'admin.hotels.paymentTransactions.create': [
    { label: ROOT_LABEL, routeName: 'home' },
    { label: 'Administracion', routeName: 'admin.index' },
    { label: 'Hoteles', routeName: 'admin.hotels.index' },
    { label: 'Transacciones de pago', routeName: 'admin.hotels.paymentTransactions.index' },
    { label: 'Nueva transaccion' },
  ],
  'admin.hotels.paymentTransactions.edit': [
    { label: ROOT_LABEL, routeName: 'home' },
    { label: 'Administracion', routeName: 'admin.index' },
    { label: 'Hoteles', routeName: 'admin.hotels.index' },
    { label: 'Transacciones de pago', routeName: 'admin.hotels.paymentTransactions.index' },
    { label: 'Editar transaccion' },
  ],
  'admin.hotels.paymentReservationAllocations.index': [
    { label: ROOT_LABEL, routeName: 'home' },
    { label: 'Administracion', routeName: 'admin.index' },
    { label: 'Hoteles', routeName: 'admin.hotels.index' },
    { label: 'Asignaciones a reservacion', routeName: 'admin.hotels.paymentReservationAllocations.index' },
  ],
  'admin.hotels.paymentReservationAllocations.create': [
    { label: ROOT_LABEL, routeName: 'home' },
    { label: 'Administracion', routeName: 'admin.index' },
    { label: 'Hoteles', routeName: 'admin.hotels.index' },
    { label: 'Asignaciones a reservacion', routeName: 'admin.hotels.paymentReservationAllocations.index' },
    { label: 'Nueva asignacion' },
  ],
  'admin.hotels.paymentReservationAllocations.edit': [
    { label: ROOT_LABEL, routeName: 'home' },
    { label: 'Administracion', routeName: 'admin.index' },
    { label: 'Hoteles', routeName: 'admin.hotels.index' },
    { label: 'Asignaciones a reservacion', routeName: 'admin.hotels.paymentReservationAllocations.index' },
    { label: 'Editar asignacion' },
  ],
  'admin.hotels.paymentChargeAllocations.index': [
    { label: ROOT_LABEL, routeName: 'home' },
    { label: 'Administracion', routeName: 'admin.index' },
    { label: 'Hoteles', routeName: 'admin.hotels.index' },
    { label: 'Asignaciones a cargos', routeName: 'admin.hotels.paymentChargeAllocations.index' },
  ],
  'admin.hotels.paymentChargeAllocations.create': [
    { label: ROOT_LABEL, routeName: 'home' },
    { label: 'Administracion', routeName: 'admin.index' },
    { label: 'Hoteles', routeName: 'admin.hotels.index' },
    { label: 'Asignaciones a cargos', routeName: 'admin.hotels.paymentChargeAllocations.index' },
    { label: 'Nueva asignacion' },
  ],
  'admin.hotels.paymentChargeAllocations.edit': [
    { label: ROOT_LABEL, routeName: 'home' },
    { label: 'Administracion', routeName: 'admin.index' },
    { label: 'Hoteles', routeName: 'admin.hotels.index' },
    { label: 'Asignaciones a cargos', routeName: 'admin.hotels.paymentChargeAllocations.index' },
    { label: 'Editar asignacion' },
  ],
}

export default class BreadcrumbService {
  static build(path: string, routeName?: string): BreadcrumbItem[] {
    if (routeName && namedBreadcrumbs[routeName]) {
      return finalizeDefinition(namedBreadcrumbs[routeName])
    }

    const pathname = normalizePath(path)

    if (pathname === '/') {
      return finalize([{ label: ROOT_LABEL, href: '/' }])
    }

    if (pathname === '/dashboard') {
      return finalize([
        { label: ROOT_LABEL, href: '/' },
        { label: 'Dashboard', href: '/dashboard' },
      ])
    }

    if (pathname === '/admin') {
      return finalize([
        { label: ROOT_LABEL, href: '/' },
        { label: 'Administracion', href: '/admin' },
      ])
    }

    if (pathname === '/admin/users') {
      return finalize([
        { label: ROOT_LABEL, href: '/' },
        { label: 'Administracion', href: '/admin' },
        { label: 'Usuarios', href: '/admin/users' },
      ])
    }

    if (pathname === '/admin/roles') {
      return finalize([
        { label: ROOT_LABEL, href: '/' },
        { label: 'Administracion', href: '/admin' },
        { label: 'Roles', href: '/admin/roles' },
      ])
    }

    if (pathname === '/admin/permissions') {
      return finalize([
        { label: ROOT_LABEL, href: '/' },
        { label: 'Administracion', href: '/admin' },
        { label: 'Permisos', href: '/admin/permissions' },
      ])
    }

    if (pathname === '/admin/audit-logs') {
      return finalize([
        { label: ROOT_LABEL, href: '/' },
        { label: 'Administracion', href: '/admin' },
        { label: 'Audit Logs', href: '/admin/audit-logs' },
      ])
    }

    if (/^\/admin\/roles\/[^/]+\/permissions$/.test(pathname)) {
      return finalize([
        { label: ROOT_LABEL, href: '/' },
        { label: 'Administracion', href: '/admin' },
        { label: 'Roles', href: '/admin/roles' },
        { label: 'Permisos del Rol' },
      ])
    }

    if (pathname.startsWith('/admin')) {
      return finalize([
        { label: ROOT_LABEL, href: '/' },
        { label: 'Administracion', href: '/admin' },
      ])
    }

    return finalize([
      { label: ROOT_LABEL, href: '/' },
      { label: 'Seccion actual' },
    ])
  }
}
