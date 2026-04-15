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

export const customerTypeOptions = makeOptions(customerTypeLabels)
export const documentTypeOptions = makeOptions(documentTypeLabels)
export const roomStatusOptions = makeOptions(roomStatusLabels)
export const seasonTypeOptions = makeOptions(seasonTypeLabels)
export const pricingScopeOptions = makeOptions(pricingScopeLabels)
export const priceBasisOptions = makeOptions(priceBasisLabels)
export const chargeKindOptions = makeOptions(chargeKindLabels)
export const unitOfMeasureOptions = makeOptions(unitOfMeasureLabels)

export const customerTypeLabel = (value: string | null | undefined) => getLabel(customerTypeLabels, value)
export const documentTypeLabel = (value: string | null | undefined) => getLabel(documentTypeLabels, value)
export const roomStatusLabel = (value: string | null | undefined) => getLabel(roomStatusLabels, value)
export const seasonTypeLabel = (value: string | null | undefined) => getLabel(seasonTypeLabels, value)
export const pricingScopeLabel = (value: string | null | undefined) => getLabel(pricingScopeLabels, value)
export const priceBasisLabel = (value: string | null | undefined) => getLabel(priceBasisLabels, value)
export const chargeKindLabel = (value: string | null | undefined) => getLabel(chargeKindLabels, value)
export const unitOfMeasureLabel = (value: string | null | undefined) => getLabel(unitOfMeasureLabels, value)
