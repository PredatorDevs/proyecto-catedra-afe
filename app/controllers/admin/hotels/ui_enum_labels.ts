import type { CatalogField } from '#controllers/admin/hotels/ui_support'

const makeOptions = (labels: Record<string, string>): CatalogField['options'] =>
  Object.entries(labels).map(([value, label]) => ({ value, label }))

const getLabel = (labels: Record<string, string>, value: string | null | undefined) => {
  if (!value) return '-'
  return labels[value] ?? value
}

export const customerTypeLabels: Record<string, string> = {
  INDIVIDUAL: 'Persona natural',
  COMPANY: 'Empresa',
}

export const documentTypeLabels: Record<string, string> = {
  DUI: 'DUI',
  PASSPORT: 'Pasaporte',
  NIT: 'NIT',
  OTHER: 'Otro documento',
}

export const roomStatusLabels: Record<string, string> = {
  AVAILABLE_CLEAN: 'Disponible y limpia',
  RESERVED: 'Reservada',
  OCCUPIED: 'Ocupada',
  DIRTY: 'Sucia',
  CLEANING_IN_PROGRESS: 'Limpieza en progreso',
  INSPECTED: 'Inspeccionada',
  BLOCKED: 'Bloqueada',
  MAINTENANCE: 'En mantenimiento',
  OUT_OF_SERVICE: 'Fuera de servicio',
}

export const seasonTypeLabels: Record<string, string> = {
  HIGH: 'Temporada alta',
  LOW: 'Temporada baja',
  PROMOTIONAL: 'Promocional',
  SPECIAL: 'Especial',
}

export const pricingScopeLabels: Record<string, string> = {
  ROOM_TYPE: 'Por tipo de habitación',
  ROOM: 'Por habitación específica',
}

export const priceBasisLabels: Record<string, string> = {
  NIGHT: 'Por noche',
  STAY: 'Por estadía completa',
}

export const chargeKindLabels: Record<string, string> = {
  PRODUCT: 'Producto',
  SERVICE: 'Servicio',
  PENALTY: 'Penalización',
  EXTRA_GUEST: 'Huésped adicional',
  OTHER: 'Otro',
}

export const unitOfMeasureLabels: Record<string, string> = {
  UNIT: 'Unidad',
  DAY: 'Día',
  HOUR: 'Hora',
  PERSON: 'Persona',
  SERVICE: 'Servicio',
}

export const reservationSourceLabels: Record<string, string> = {
  WEB: 'Web',
  RECEPTION: 'Recepción',
  PHONE: 'Teléfono',
  WALK_IN: 'Walk-in',
  OTHER: 'Otro canal',
}

export const reservationStatusLabels: Record<string, string> = {
  DRAFT: 'Borrador',
  PENDING_ADMIN_CONFIRMATION: 'Pendiente de confirmación administrativa',
  PENDING_PAYMENT: 'Pendiente de pago',
  PAYMENT_UNDER_REVIEW: 'Pago en revisión',
  CONFIRMED: 'Confirmada',
  CHECKED_IN: 'Check-in realizado',
  CHECKED_OUT: 'Check-out realizado',
  CANCELLED: 'Cancelada',
  EXPIRED: 'Expirada',
  NO_SHOW: 'No show',
  REFUND_PENDING: 'Reembolso pendiente',
  REFUNDED: 'Reembolsada',
}

export const reservationGuestTypeLabels: Record<string, string> = {
  PRIMARY: 'Titular',
  ADDITIONAL: 'Adicional',
}

export const checkinCheckoutActionLabels: Record<string, string> = {
  CHECK_IN: 'Check-in',
  CHECK_OUT: 'Check-out',
  ROOM_CHANGE_OUT: 'Cambio habitación (salida)',
  ROOM_CHANGE_IN: 'Cambio habitación (entrada)',
  NO_SHOW: 'No show',
}

export const reservationChargeStatusLabels: Record<string, string> = {
  PENDING: 'Pendiente',
  PAID: 'Pagado',
  BILLED: 'Facturado',
  VOIDED: 'Anulado',
}

export const customerTypeOptions = makeOptions(customerTypeLabels)
export const documentTypeOptions = makeOptions(documentTypeLabels)
export const roomStatusOptions = makeOptions(roomStatusLabels)
export const seasonTypeOptions = makeOptions(seasonTypeLabels)
export const pricingScopeOptions = makeOptions(pricingScopeLabels)
export const priceBasisOptions = makeOptions(priceBasisLabels)
export const chargeKindOptions = makeOptions(chargeKindLabels)
export const unitOfMeasureOptions = makeOptions(unitOfMeasureLabels)
export const reservationSourceOptions = makeOptions(reservationSourceLabels)
export const reservationStatusOptions = makeOptions(reservationStatusLabels)
export const reservationGuestTypeOptions = makeOptions(reservationGuestTypeLabels)
export const checkinCheckoutActionOptions = makeOptions(checkinCheckoutActionLabels)
export const reservationChargeStatusOptions = makeOptions(reservationChargeStatusLabels)

export const customerTypeLabel = (value: string | null | undefined) => getLabel(customerTypeLabels, value)
export const documentTypeLabel = (value: string | null | undefined) => getLabel(documentTypeLabels, value)
export const roomStatusLabel = (value: string | null | undefined) => getLabel(roomStatusLabels, value)
export const seasonTypeLabel = (value: string | null | undefined) => getLabel(seasonTypeLabels, value)
export const pricingScopeLabel = (value: string | null | undefined) => getLabel(pricingScopeLabels, value)
export const priceBasisLabel = (value: string | null | undefined) => getLabel(priceBasisLabels, value)
export const chargeKindLabel = (value: string | null | undefined) => getLabel(chargeKindLabels, value)
export const unitOfMeasureLabel = (value: string | null | undefined) => getLabel(unitOfMeasureLabels, value)
export const reservationSourceLabel = (value: string | null | undefined) => getLabel(reservationSourceLabels, value)
export const reservationStatusLabel = (value: string | null | undefined) => getLabel(reservationStatusLabels, value)
export const reservationGuestTypeLabel = (value: string | null | undefined) =>
  getLabel(reservationGuestTypeLabels, value)
export const checkinCheckoutActionLabel = (value: string | null | undefined) =>
  getLabel(checkinCheckoutActionLabels, value)
export const reservationChargeStatusLabel = (value: string | null | undefined) =>
  getLabel(reservationChargeStatusLabels, value)
