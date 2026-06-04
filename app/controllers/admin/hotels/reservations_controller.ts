import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import Reservation from '#models/reservation'
import Customer from '#models/customer'
import RoomType from '#models/room_type'
import Room from '#models/room'
import RoomPrice from '#models/room_price'
import CheckinCheckoutLog from '#models/checkin_checkout_log'
import AuditLogger from '#services/audit_logger'
import { createReservationValidator } from '#validators/admin/hotels/create_reservation_validator'
import {
  prefersHtml,
  renderCatalogForm,
  renderCatalogIndex,
  respondConflictOrRedirect,
  respondSuccessOrJson,
  type CatalogField,
} from '#controllers/admin/hotels/ui_support'
import {
  roomStatusLabel,
  reservationSourceLabel,
  reservationSourceOptions,
  reservationStatusLabel,
  reservationStatusOptions,
} from '#controllers/admin/hotels/ui_enum_labels'

type ReservationSource = 'WEB' | 'RECEPTION' | 'PHONE' | 'WALK_IN' | 'OTHER'
type ReservationStatus =
  | 'DRAFT'
  | 'PENDING_ADMIN_CONFIRMATION'
  | 'PENDING_PAYMENT'
  | 'PAYMENT_UNDER_REVIEW'
  | 'CONFIRMED'
  | 'CHECKED_IN'
  | 'CHECKED_OUT'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'NO_SHOW'
  | 'REFUND_PENDING'
  | 'REFUNDED'

type ReservationQuickAction = 'CONFIRM' | 'CHECK_IN' | 'CHECK_OUT' | 'NO_SHOW'

const blockedRoomStatuses = new Set([
  'BLOCKED',
  'MAINTENANCE',
  'OUT_OF_SERVICE',
  'DIRTY',
  'CLEANING_IN_PROGRESS',
])

const notSelectableRoomStatuses = new Set([
  'RESERVED',
  'OCCUPIED',
  ...Array.from(blockedRoomStatuses),
])

const nonOverlappingStatuses = ['CANCELLED', 'EXPIRED', 'NO_SHOW', 'CHECKED_OUT', 'REFUNDED']

const creatableStatuses: ReservationStatus[] = [
  'DRAFT',
  'PENDING_ADMIN_CONFIRMATION',
  'PENDING_PAYMENT',
  'PAYMENT_UNDER_REVIEW',
  'CONFIRMED',
]

const cancellableStatuses = new Set<ReservationStatus>([
  'DRAFT',
  'PENDING_ADMIN_CONFIRMATION',
  'PENDING_PAYMENT',
  'PAYMENT_UNDER_REVIEW',
  'CONFIRMED',
])

const allowedStatusTransitions: Partial<Record<ReservationStatus, ReservationStatus[]>> = {
  DRAFT: ['PENDING_ADMIN_CONFIRMATION', 'PENDING_PAYMENT', 'CONFIRMED', 'CANCELLED', 'EXPIRED'],
  PENDING_ADMIN_CONFIRMATION: ['PENDING_PAYMENT', 'CONFIRMED', 'CANCELLED', 'EXPIRED'],
  PENDING_PAYMENT: ['PAYMENT_UNDER_REVIEW', 'CONFIRMED', 'CANCELLED', 'EXPIRED'],
  PAYMENT_UNDER_REVIEW: ['PENDING_PAYMENT', 'CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['CANCELLED', 'NO_SHOW', 'REFUND_PENDING'],
  CHECKED_IN: ['CHECKED_OUT'],
  CHECKED_OUT: [],
  CANCELLED: ['REFUND_PENDING'],
  EXPIRED: [],
  NO_SHOW: [],
  REFUND_PENDING: ['REFUNDED'],
  REFUNDED: [],
}

function canTransitionStatus(from: ReservationStatus, to: ReservationStatus) {
  if (from === to) return true
  return (allowedStatusTransitions[from] || []).includes(to)
}

function toDateTime(value: Date | undefined): DateTime | null {
  if (!value) return null
  return DateTime.fromJSDate(value)
}

function reservationNumber() {
  const stamp = DateTime.now().toFormat('yyyyLLddHHmmss')
  const rand = Math.floor(Math.random() * 9000) + 1000
  return `RSV-${stamp}-${rand}`
}

function toMoney(value: number | undefined, fallback = 0) {
  if (typeof value !== 'number' || Number.isNaN(value)) return fallback
  return value
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

function appendNote(existing: string | null, note: string) {
  const cleanExisting = (existing || '').trim()
  return cleanExisting ? `${cleanExisting}\n${note}` : note
}

function reservationStatusBadgeClass(status: ReservationStatus) {
  switch (status) {
    case 'DRAFT':
      return 'reservation-status-badge reservation-status-draft'
    case 'PENDING_ADMIN_CONFIRMATION':
    case 'PENDING_PAYMENT':
    case 'PAYMENT_UNDER_REVIEW':
      return 'reservation-status-badge reservation-status-pending'
    case 'CONFIRMED':
      return 'reservation-status-badge reservation-status-confirmed'
    case 'CHECKED_IN':
      return 'reservation-status-badge reservation-status-checked-in'
    case 'CHECKED_OUT':
      return 'reservation-status-badge reservation-status-checked-out'
    case 'CANCELLED':
    case 'REFUNDED':
      return 'reservation-status-badge reservation-status-cancelled'
    case 'EXPIRED':
    case 'NO_SHOW':
      return 'reservation-status-badge reservation-status-inactive'
    case 'REFUND_PENDING':
      return 'reservation-status-badge reservation-status-refund-pending'
    default:
      return 'reservation-status-badge'
  }
}

export default class ReservationsController {
  private nightsBetween(checkIn: DateTime, checkOut: DateTime) {
    const diffInDays = checkOut.diff(checkIn, 'days').days
    return Math.max(1, Math.ceil(diffInDays))
  }

  private isDayEnabledInMask(mask: string, date: DateTime) {
    const normalizedMask = mask.trim()
    if (!/^[01]{7}$/.test(normalizedMask)) {
      return true
    }

    const index = date.weekday - 1
    return normalizedMask[index] === '1'
  }

  private stayMatchesMask(mask: string, checkIn: DateTime, nights: number) {
    for (let offset = 0; offset < nights; offset++) {
      const day = checkIn.plus({ days: offset })
      if (!this.isDayEnabledInMask(mask, day)) {
        return false
      }
    }

    return true
  }

  private calculateLodgingSubtotal(
    basePrice: number,
    extraGuestPrice: number,
    priceBasis: 'NIGHT' | 'STAY',
    nights: number,
    guests: number,
    baseCapacity: number
  ) {
    const extraGuests = Math.max(0, guests - baseCapacity)
    const unitAmount = basePrice + extraGuestPrice * extraGuests

    if (priceBasis === 'STAY') {
      return roundMoney(unitAmount)
    }

    return roundMoney(unitAmount * nights)
  }

  private async findApplicableRoomPrice(
    roomTypeId: number,
    roomId: number | null,
    checkIn: DateTime,
    checkOut: DateTime
  ) {
    const baseQuery = RoomPrice.query()
      .where('room_type_id', roomTypeId)
      .where('is_active', 1)
      .where('valid_from', '<=', checkIn.toSQL()!)
      .where('valid_to', '>=', checkOut.toSQL()!)
      .orderBy('priority', 'asc')
      .orderBy('id', 'desc')

    const roomScoped = roomId
      ? await baseQuery.clone().where('pricing_scope', 'ROOM').where('room_id', roomId)
      : []
    const typeScoped = await baseQuery.clone().where('pricing_scope', 'ROOM_TYPE').whereNull('room_id')
    const candidates = [...roomScoped, ...typeScoped]
    const nights = this.nightsBetween(checkIn, checkOut)

    return candidates.find((price) => this.stayMatchesMask(price.daysOfWeekMask || '1111111', checkIn, nights)) || null
  }

  private overlapQueryForRoom(roomId: number, checkIn: DateTime, checkOut: DateTime, currentId?: number) {
    const query = Reservation.query()
      .where('room_id', roomId)
      .whereNotIn('status', nonOverlappingStatuses)
      .where('check_in_planned_at', '<', checkOut.toSQL()!)
      .where('check_out_planned_at', '>', checkIn.toSQL()!)

    if (currentId !== undefined) {
      query.whereNot('id', currentId)
    }

    return query
  }

  private async findAvailableRoomByType(roomTypeId: number, checkIn: DateTime, checkOut: DateTime, currentId?: number) {
    const candidates = await Room.query()
      .where('room_type_id', roomTypeId)
      .where('is_active', true)
      .whereNotIn('current_status', Array.from(notSelectableRoomStatuses))
      .orderBy('id', 'asc')

    for (const room of candidates) {
      const overlap = await this.overlapQueryForRoom(room.id, checkIn, checkOut, currentId).first()
      if (!overlap) {
        return room
      }
    }

    return null
  }

  private async findUpgradeOffer(
    requestedType: RoomType,
    checkIn: DateTime,
    checkOut: DateTime,
    currentId?: number
  ) {
    const betterTypes = await RoomType.query()
      .where('is_active', true)
      .whereNot('id', requestedType.id)
      .where('default_nightly_price', '>', requestedType.defaultNightlyPrice)
      .where('base_capacity', '>=', requestedType.baseCapacity)
      .where('max_capacity', '>=', requestedType.maxCapacity)
      .orderBy('default_nightly_price', 'asc')
      .orderBy('max_capacity', 'asc')

    for (const candidateType of betterTypes) {
      const candidateRoom = await this.findAvailableRoomByType(candidateType.id, checkIn, checkOut, currentId)
      if (candidateRoom) {
        return { roomType: candidateType, room: candidateRoom }
      }
    }

    return null
  }

  private isConfirmableStatus(status: ReservationStatus) {
    return ['DRAFT', 'PENDING_ADMIN_CONFIRMATION', 'PENDING_PAYMENT', 'PAYMENT_UNDER_REVIEW'].includes(status)
  }

  private buildIndexActions(row: Reservation) {
    const status = row.status as ReservationStatus
    const actions: Array<Record<string, unknown>> = []

    if (this.isConfirmableStatus(status)) {
      actions.push({
        label: 'Confirmar',
        href: `/admin/hotels/reservations/${row.id}/transition`,
        method: 'POST',
        buttonClass: 'reservation-action-btn reservation-action-confirm',
        icon: 'confirm',
        confirmMessage: 'Se cambiara el estado de la reservacion a CONFIRMED. Deseas continuar?',
        inputs: [{ name: 'action', value: 'CONFIRM' }],
      })
    }

    if (status === 'CONFIRMED') {
      actions.push(
        {
          label: 'Marcar check-in',
          href: `/admin/hotels/reservations/${row.id}/transition`,
          method: 'POST',
          buttonClass: 'reservation-action-btn reservation-action-checkin',
          icon: 'checkin',
          confirmMessage: 'Se registrara CHECK_IN operativo para esta reservacion. Deseas continuar?',
          inputs: [{ name: 'action', value: 'CHECK_IN' }],
        },
        {
          label: 'Marcar no-show',
          href: `/admin/hotels/reservations/${row.id}/transition`,
          method: 'POST',
          buttonClass: 'reservation-action-btn reservation-action-noshow',
          icon: 'noshow',
          confirmMessage: 'Se registrara NO_SHOW para esta reservacion. Deseas continuar?',
          inputs: [{ name: 'action', value: 'NO_SHOW' }],
        }
      )
    }

    if (status === 'CHECKED_IN') {
      actions.push(
        {
          label: 'Marcar check-out',
          href: `/admin/hotels/reservations/${row.id}/transition`,
          method: 'POST',
          buttonClass: 'reservation-action-btn reservation-action-checkout',
          icon: 'checkout',
          confirmMessage: 'Se registrara CHECK_OUT operativo para esta reservacion. Deseas continuar?',
          inputs: [{ name: 'action', value: 'CHECK_OUT' }],
        },
        {
          label: 'Checkout + Facturar CF',
          href: '/admin/hotels/fiscal-documents/generate-from-reservation',
          method: 'POST',
          buttonClass: 'reservation-action-btn reservation-action-invoice-cf',
          icon: 'invoice',
          confirmMessage: 'Se realizara checkout automatico y se emitira Consumidor Final. Deseas continuar?',
          inputs: [
            { name: 'reservationId', value: row.id },
            { name: 'documentType', value: 'CONSUMER_FINAL' },
            { name: 'currencyCode', value: 'USD' },
            { name: 'autoCheckout', value: 'true' },
          ],
        },
        {
          label: 'Checkout + Facturar CCF',
          href: '/admin/hotels/fiscal-documents/generate-from-reservation',
          method: 'POST',
          buttonClass: 'reservation-action-btn reservation-action-invoice-ccf',
          icon: 'invoice',
          confirmMessage: 'Se realizara checkout automatico y se emitira Credito Fiscal. Deseas continuar?',
          inputs: [
            { name: 'reservationId', value: row.id },
            { name: 'documentType', value: 'CREDITO_FISCAL' },
            { name: 'currencyCode', value: 'USD' },
            { name: 'autoCheckout', value: 'true' },
          ],
        }
      )
    }

    if (status === 'CHECKED_OUT') {
      actions.push(
        {
          label: 'Facturar CF',
          href: '/admin/hotels/fiscal-documents/generate-from-reservation',
          method: 'POST',
          buttonClass: 'reservation-action-btn reservation-action-invoice-cf',
          icon: 'invoice',
          confirmMessage: 'Se emitira Consumidor Final para esta reservacion. Deseas continuar?',
          inputs: [
            { name: 'reservationId', value: row.id },
            { name: 'documentType', value: 'CONSUMER_FINAL' },
            { name: 'currencyCode', value: 'USD' },
            { name: 'autoCheckout', value: 'false' },
          ],
        },
        {
          label: 'Facturar CCF',
          href: '/admin/hotels/fiscal-documents/generate-from-reservation',
          method: 'POST',
          buttonClass: 'reservation-action-btn reservation-action-invoice-ccf',
          icon: 'invoice',
          confirmMessage: 'Se emitira Credito Fiscal para esta reservacion. Deseas continuar?',
          inputs: [
            { name: 'reservationId', value: row.id },
            { name: 'documentType', value: 'CREDITO_FISCAL' },
            { name: 'currencyCode', value: 'USD' },
            { name: 'autoCheckout', value: 'false' },
          ],
        }
      )
    }

    return actions
  }

  async index(ctx: HttpContext) {
    const rows = await Reservation.query()
      .preload('customer')
      .preload('roomType')
      .preload('room')
      .preload('appliedRoomPrice')
      .orderBy('id', 'desc')

    if (prefersHtml(ctx)) {
      return renderCatalogIndex(ctx, {
        pageKicker: 'Reservaciones',
        pageTitle: 'Reservaciones',
        pageSubtitle: 'Gestiona ciclo de vida, huésped principal, fechas y montos de cada reserva.',
        createHref: '/admin/hotels/reservations/new',
        createLabel: 'Nueva reservación',
        editBaseHref: '/admin/hotels/reservations',
        columns: [
          { key: 'reservationNumber', label: 'Número', badge: true },
          { key: 'customer', label: 'Cliente' },
          { key: 'roomType', label: 'Tipo habitación' },
          { key: 'appliedRate', label: 'Tarifa aplicada' },
          { key: 'source', label: 'Origen', badge: true },
          { key: 'status', label: 'Estado', badge: true },
          { key: 'roomNotice', label: 'Aviso habitación', badge: true },
          { key: 'range', label: 'Fechas' },
          { key: 'totalAmount', label: 'Total' },
        ],
        rows: rows.map((row) => ({
          id: row.id,
          reservationNumber: row.reservationNumber,
          customer: row.customer.fullName,
          roomType: row.room ? `${row.roomType.code}/${row.room.roomNumber}` : row.roomType.code,
          appliedRate: row.appliedRoomPrice
            ? `#${row.appliedRoomPrice.id} ${row.appliedRoomPrice.name}`
            : `Precio base ${row.roomType.code}`,
          source: reservationSourceLabel(row.source),
          status: reservationStatusLabel(row.status),
          statusBadgeClass: reservationStatusBadgeClass(row.status as ReservationStatus),
          roomNotice:
            row.status === 'CANCELLED' && row.roomId
              ? 'Habitación en mantenimiento'
              : row.roomId
                ? 'Sin alerta'
                : '-',
          range: `${row.checkInPlannedAt.toFormat('yyyy-LL-dd')} -> ${row.checkOutPlannedAt.toFormat('yyyy-LL-dd')}`,
          totalAmount: Number(row.totalAmount).toFixed(2),
          canCancel: cancellableStatuses.has(row.status as ReservationStatus),
          extraActions: this.buildIndexActions(row),
        })),
        cancellationModal: {
          title: 'Cancelar reservación',
          actionBaseHref: '/admin/hotels/reservations',
        },
      })
    }

    return ctx.response.ok({ data: rows })
  }

  private async fields(): Promise<CatalogField[]> {
    const [customers, roomTypes, rooms, roomPrices] = await Promise.all([
      Customer.query().orderBy('full_name', 'asc'),
      RoomType.query().orderBy('code', 'asc'),
      Room.query().preload('roomType').orderBy('room_number', 'asc'),
      RoomPrice.query().preload('roomType').orderBy('priority', 'asc').orderBy('id', 'desc').limit(300),
    ])

    return [
      {
        name: 'customerId',
        label: 'Cliente',
        type: 'select',
        required: true,
        colSpanMd: 2,
        colSpanXl: 2,
        options: customers.map((item) => ({ value: item.id, label: `${item.id} - ${item.fullName}` })),
      },
      {
        name: 'roomTypeId',
        label: 'Tipo de habitación',
        type: 'select',
        required: true,
        options: roomTypes.map((item) => ({
          value: item.id,
          label: `${item.code} - ${item.name}`,
          defaultNightlyPrice: item.defaultNightlyPrice,
          baseCapacity: item.baseCapacity,
        })),
      },
      {
        name: 'roomId',
        label: 'Habitación específica (opcional)',
        helpText:
          'Las habitaciones en estado reservada, ocupada o no disponible operativamente aparecen bloqueadas y no pueden seleccionarse.',
        type: 'select',
        colSpanMd: 2,
        colSpanXl: 1,
        options: rooms.map((item) => ({
          value: item.id,
          label: `${item.roomNumber} - ${item.roomType.code} (${roomStatusLabel(item.currentStatus)})${notSelectableRoomStatuses.has(item.currentStatus) ? ' - no disponible' : ''}`,
          disabled: notSelectableRoomStatuses.has(item.currentStatus),
        })),
      },
      {
        name: 'allowUpgradeAtSamePrice',
        label: 'Permitir upgrade al mismo precio si no hay disponibilidad',
        type: 'checkbox',
        colSpanMd: 2,
        colSpanXl: 2,
      },
      {
        name: 'appliedRoomPriceId',
        label: 'Tarifa aplicada (opcional)',
        helpText:
          'Sugerimos una tarifa automáticamente según tipo, habitación y fechas. Si no seleccionas una, el servidor aplicará la mejor tarifa vigente.',
        type: 'select',
        colSpanMd: 2,
        colSpanXl: 2,
        options: roomPrices.map((item) => ({
          value: item.id,
          label: `#${item.id} ${item.name} (${item.roomType.code}) - ${Number(item.basePrice).toFixed(2)} + ${Number(item.extraGuestPrice).toFixed(2)} extra - ${item.priceBasis === 'STAY' ? 'por estadia' : 'por noche'} - ${item.pricingScope === 'ROOM' ? `hab ${item.roomId}` : 'tipo'}`,
          basePrice: item.basePrice,
          extraGuestPrice: item.extraGuestPrice,
          priceBasis: item.priceBasis,
          pricingScope: item.pricingScope,
          roomId: item.roomId,
          roomTypeId: item.roomTypeId,
          validFrom: item.validFrom.toFormat('yyyy-LL-dd'),
          validTo: item.validTo.toFormat('yyyy-LL-dd'),
          daysOfWeekMask: item.daysOfWeekMask,
          isActive: item.isActive,
        })),
      },
      { name: 'source', label: 'Origen', type: 'select', options: reservationSourceOptions },
      { name: 'status', label: 'Estado', type: 'select', options: reservationStatusOptions },
      { name: 'adultsCount', label: 'Adultos', type: 'number', min: 1 },
      { name: 'childrenCount', label: 'Niños', type: 'number', min: 0 },
      { name: 'guestsCount', label: 'Huéspedes totales', type: 'number', min: 1 },
      { name: 'checkInPlannedAt', label: 'Check-in planificado', type: 'date', required: true },
      { name: 'checkOutPlannedAt', label: 'Check-out planificado', type: 'date', required: true },
      { name: 'checkInDeadlineAt', label: 'Fecha límite check-in', type: 'date' },
      { name: 'expiresAt', label: 'Expira en', type: 'date' },
      {
        name: 'lodgingSubtotal',
        label: 'Subtotal hospedaje (automático)',
        type: 'number',
        min: 0,
        step: '0.01',
        readOnly: true,
        helpText:
          'Se calcula automáticamente desde la tarifa vigente y la duración de la estancia. Si no hay tarifa aplicable, se usa el precio base del tipo.',
      },
      { name: 'discountTotal', label: 'Descuento total', type: 'number', min: 0, step: '0.01' },
      { name: 'ivaTotal', label: 'IVA total', type: 'number', min: 0, step: '0.01' },
      { name: 'tourismTaxTotal', label: 'Impuesto turismo', type: 'number', min: 0, step: '0.01' },
      { name: 'specialRequests', label: 'Solicitudes especiales', type: 'textarea', fullWidth: true },
      { name: 'internalNotes', label: 'Notas internas', type: 'textarea', fullWidth: true },
    ]
  }

  async create(ctx: HttpContext) {
    return renderCatalogForm(ctx, {
      formMode: 'create',
      formKicker: 'Reservaciones',
      formTitle: 'Nueva reservación',
      formSubtitle: 'Registra una nueva solicitud con datos de huésped, fechas y montos.',
      formAction: '/admin/hotels/reservations',
      submitLabel: 'Crear reservación',
      backHref: '/admin/hotels/reservations',
      fields: await this.fields(),
      values: {
        source: 'WEB',
        status: 'DRAFT',
        allowUpgradeAtSamePrice: false,
        adultsCount: 1,
        childrenCount: 0,
        guestsCount: 1,
        lodgingSubtotal: 0,
        discountTotal: 0,
        ivaTotal: 0,
        tourismTaxTotal: 0,
      },
    })
  }

  async edit(ctx: HttpContext) {
    const row = await Reservation.findOrFail(ctx.params.id)
    const canGenerateFiscal = row.status === 'CHECKED_IN' || row.status === 'CHECKED_OUT'
    const requiresAutoCheckout = row.status === 'CHECKED_IN'
    const fiscalActionHint = canGenerateFiscal
      ? null
      : 'La facturacion solo se habilita cuando la reservacion esta CHECKED_IN o CHECKED_OUT. Si esta CONFIRMED, registra CHECK_IN desde logs operativos para habilitar Checkout + Facturar.'

    return renderCatalogForm(ctx, {
      formMode: 'edit',
      formKicker: 'Reservaciones',
      formTitle: `Editar reservación #${row.id}`,
      formSubtitle: 'Actualiza estado, fechas, habitación y montos de la reservación.',
      formAction: `/admin/hotels/reservations/${row.id}/update`,
      submitLabel: 'Guardar cambios',
      backHref: '/admin/hotels/reservations',
      fields: await this.fields(),
      fiscalActionHint,
      extraActions: canGenerateFiscal
        ? [
            {
              label: requiresAutoCheckout ? 'Checkout + Facturar CF' : 'Facturar CF',
              href: '/admin/hotels/fiscal-documents/generate-from-reservation',
              method: 'POST',
              buttonClass: 'btn-info',
              confirmMessage: requiresAutoCheckout
                ? 'Se realizara checkout automatico y se emitira Consumidor Final. Deseas continuar?'
                : 'Se emitira Consumidor Final para esta reservacion. Deseas continuar?',
              inputs: [
                { name: 'reservationId', value: row.id },
                { name: 'documentType', value: 'CONSUMER_FINAL' },
                { name: 'currencyCode', value: 'USD' },
                { name: 'autoCheckout', value: requiresAutoCheckout ? 'true' : 'false' },
              ],
            },
            {
              label: requiresAutoCheckout ? 'Checkout + Facturar CCF' : 'Facturar CCF',
              href: '/admin/hotels/fiscal-documents/generate-from-reservation',
              method: 'POST',
              buttonClass: 'btn-warning',
              confirmMessage: requiresAutoCheckout
                ? 'Se realizara checkout automatico y se emitira Credito Fiscal. Deseas continuar?'
                : 'Se emitira Credito Fiscal para esta reservacion. Deseas continuar?',
              inputs: [
                { name: 'reservationId', value: row.id },
                { name: 'documentType', value: 'CREDITO_FISCAL' },
                { name: 'currencyCode', value: 'USD' },
                { name: 'autoCheckout', value: requiresAutoCheckout ? 'true' : 'false' },
              ],
            },
          ]
        : [],
      values: {
        reservationNumber: row.reservationNumber,
        customerId: row.customerId,
        roomTypeId: row.roomTypeId,
        roomId: row.roomId,
        allowUpgradeAtSamePrice: false,
        appliedRoomPriceId: row.appliedRoomPriceId,
        source: row.source,
        status: row.status,
        adultsCount: row.adultsCount,
        childrenCount: row.childrenCount,
        guestsCount: row.guestsCount,
        checkInPlannedAt: row.checkInPlannedAt.toISODate(),
        checkOutPlannedAt: row.checkOutPlannedAt.toISODate(),
        checkInDeadlineAt: row.checkInDeadlineAt?.toISODate(),
        expiresAt: row.expiresAt?.toISODate(),
        lodgingSubtotal: row.lodgingSubtotal,
        discountTotal: row.discountTotal,
        ivaTotal: row.ivaTotal,
        tourismTaxTotal: row.tourismTaxTotal,
        specialRequests: row.specialRequests,
        internalNotes: row.internalNotes,
      },
    })
  }

  private async applyBusinessRules(
    payload: Awaited<ReturnType<typeof createReservationValidator['validate']>>,
    currentId?: number,
    currentAmountPaid = 0
  ) {
    const checkIn = DateTime.fromJSDate(payload.checkInPlannedAt)
    const checkOut = DateTime.fromJSDate(payload.checkOutPlannedAt)

    if (checkOut <= checkIn) {
      return { error: 'La fecha/hora de salida debe ser mayor a la de entrada' }
    }

    const customer = await Customer.find(payload.customerId)
    if (!customer) {
      return { error: 'customerId no existe' }
    }

    const roomType = await RoomType.find(payload.roomTypeId)
    if (!roomType) {
      return { error: 'roomTypeId no existe' }
    }

    const allowUpgradeAtSamePrice = payload.allowUpgradeAtSamePrice ?? false

    let roomId: number | null = payload.roomId ?? null
    let resolvedRoomTypeId = payload.roomTypeId
    let resolvedRoomType = roomType
    let upgradeApplied = false
    let upgradeMessage: string | null = null

    if (roomId) {
      const room = await Room.find(roomId)
      if (!room) {
        return { error: 'roomId no existe' }
      }

      if (room.roomTypeId !== payload.roomTypeId) {
        return { error: 'roomId no pertenece al roomTypeId enviado' }
      }

      if (notSelectableRoomStatuses.has(room.currentStatus)) {
        return {
          error: `La habitación ${room.roomNumber} está ${roomStatusLabel(room.currentStatus).toLowerCase()} y no puede elegirse`,
        }
      }

      const overlap = await this.overlapQueryForRoom(roomId, checkIn, checkOut, currentId).first()

      if (overlap) {
        const offer = await this.findUpgradeOffer(roomType, checkIn, checkOut, currentId)
        if (!offer) {
          return { error: 'Existe una reservación solapada para la habitación seleccionada' }
        }

        if (!allowUpgradeAtSamePrice) {
          return {
            error: `No hay disponibilidad para ${roomType.name} en esas fechas. Podemos ofrecer ${offer.roomType.name} (habitación ${offer.room.roomNumber}) al mismo precio. Activa la opción de upgrade para confirmarlo.`,
          }
        }

        roomId = offer.room.id
        resolvedRoomTypeId = offer.roomType.id
        resolvedRoomType = offer.roomType
        upgradeApplied = true
        upgradeMessage = `Upgrade aplicado al mismo precio: ${roomType.name} -> ${offer.roomType.name} (${offer.room.roomNumber})`
      }
    } else {
      const availableRoom = await this.findAvailableRoomByType(roomType.id, checkIn, checkOut, currentId)
      if (availableRoom) {
        roomId = availableRoom.id
      } else {
        const offer = await this.findUpgradeOffer(roomType, checkIn, checkOut, currentId)
        if (!offer) {
          return { error: 'No hay habitaciones disponibles para el tipo seleccionado en esas fechas' }
        }

        if (!allowUpgradeAtSamePrice) {
          return {
            error: `No hay disponibilidad para ${roomType.name} en esas fechas. Podemos ofrecer ${offer.roomType.name} (habitación ${offer.room.roomNumber}) al mismo precio. Activa la opción de upgrade para confirmarlo.`,
          }
        }

        roomId = offer.room.id
        resolvedRoomTypeId = offer.roomType.id
        resolvedRoomType = offer.roomType
        upgradeApplied = true
        upgradeMessage = `Upgrade aplicado al mismo precio: ${roomType.name} -> ${offer.roomType.name} (${offer.room.roomNumber})`
      }
    }

    if (resolvedRoomTypeId !== resolvedRoomType.id) {
      const maybeResolvedType = await RoomType.find(resolvedRoomTypeId)
      if (!maybeResolvedType) {
        return { error: 'No se pudo resolver el tipo de habitación final para la reservación' }
      }
      resolvedRoomType = maybeResolvedType
    }

    const adults = payload.adultsCount ?? 1
    const children = payload.childrenCount ?? 0
    const guests = payload.guestsCount ?? adults + children
    if (guests < adults || guests < 1) {
      return { error: 'guestsCount debe ser mayor o igual al total de adultos y al menos 1' }
    }

    const nights = this.nightsBetween(checkIn, checkOut)
    const billingRoomType = upgradeApplied ? roomType : resolvedRoomType
    const billingRoomTypeId = billingRoomType.id

    let appliedRoomPriceId: number | null = payload.appliedRoomPriceId ?? null
    let appliedRoomPrice: RoomPrice | null = null

    if (appliedRoomPriceId) {
      const price = await RoomPrice.find(appliedRoomPriceId)
      if (!price) {
        return { error: 'appliedRoomPriceId no existe' }
      }

      if (price.roomTypeId !== billingRoomTypeId) {
        return { error: 'La tarifa aplicada no corresponde al tipo tarifario que se debe cobrar' }
      }

      if (price.pricingScope === 'ROOM' && price.roomId !== roomId) {
        return { error: 'La tarifa aplicada está configurada para otra habitación específica' }
      }

      if (!price.isActive) {
        return { error: 'La tarifa aplicada no está activa' }
      }

      if (price.validFrom > checkIn || price.validTo < checkOut) {
        return { error: 'La tarifa aplicada no cubre toda la estancia seleccionada' }
      }

      if (!this.stayMatchesMask(price.daysOfWeekMask || '1111111', checkIn, nights)) {
        return { error: 'La tarifa aplicada no cubre los días de la semana de la estancia seleccionada' }
      }

      appliedRoomPrice = price
    } else {
      appliedRoomPrice = await this.findApplicableRoomPrice(
        billingRoomTypeId,
        upgradeApplied ? null : roomId,
        checkIn,
        checkOut
      )
      appliedRoomPriceId = appliedRoomPrice?.id ?? null
    }

    const lodgingSubtotal = appliedRoomPrice
      ? this.calculateLodgingSubtotal(
          appliedRoomPrice.basePrice,
          appliedRoomPrice.extraGuestPrice,
          appliedRoomPrice.priceBasis,
          nights,
          guests,
          billingRoomType.baseCapacity
        )
      : roundMoney(billingRoomType.defaultNightlyPrice * nights)
    const discountTotal = toMoney(payload.discountTotal)
    const ivaTotal = toMoney(payload.ivaTotal)
    const tourismTaxTotal = toMoney(payload.tourismTaxTotal)
    const amountPaid = toMoney(currentAmountPaid)

    const totalAmount = roundMoney(Math.max(0, lodgingSubtotal - discountTotal + ivaTotal + tourismTaxTotal))
    const balanceDue = roundMoney(Math.max(0, totalAmount - amountPaid))

    return {
      value: {
        roomId,
        roomTypeId: resolvedRoomTypeId,
        appliedRoomPriceId,
        adults,
        children,
        guests,
        checkIn,
        checkOut,
        totalAmount,
        balanceDue,
        lodgingSubtotal,
        discountTotal,
        ivaTotal,
        tourismTaxTotal,
        amountPaid,
        upgradeApplied,
        upgradeMessage,
      },
    }
  }

  async store(ctx: HttpContext) {
    const payload = await ctx.request.validateUsing(createReservationValidator)

    const requestedStatus = ((payload.status as ReservationStatus | undefined) ?? 'DRAFT') as ReservationStatus
    if (!creatableStatuses.includes(requestedStatus)) {
      return respondConflictOrRedirect(
        ctx,
        'Estado inicial de reservacion invalido para creacion',
        '/admin/hotels/reservations/new',
        400
      )
    }

    const validation = await this.applyBusinessRules(payload)
    if (validation.error) {
      return respondConflictOrRedirect(ctx, validation.error, '/admin/hotels/reservations/new', 400)
    }

    const value = validation.value!
    const reservation = await Reservation.create({
      reservationNumber: (payload.reservationNumber || reservationNumber()).trim().toUpperCase(),
      customerId: payload.customerId,
      roomTypeId: value.roomTypeId,
      roomId: value.roomId,
      appliedRoomPriceId: value.appliedRoomPriceId,
      source: (payload.source as ReservationSource | undefined) ?? 'WEB',
      status: requestedStatus,
      adultsCount: value.adults,
      childrenCount: value.children,
      guestsCount: value.guests,
      checkInPlannedAt: value.checkIn,
      checkOutPlannedAt: value.checkOut,
      checkInDeadlineAt: toDateTime(payload.checkInDeadlineAt),
      expiresAt: toDateTime(payload.expiresAt),
      confirmedAt: toDateTime(payload.confirmedAt),
      cancelledAt: toDateTime(payload.cancelledAt),
      checkedInAt: toDateTime(payload.checkedInAt),
      checkedOutAt: toDateTime(payload.checkedOutAt),
      lodgingSubtotal: value.lodgingSubtotal,
      discountTotal: value.discountTotal,
      ivaTotal: value.ivaTotal,
      tourismTaxTotal: value.tourismTaxTotal,
      totalAmount: value.totalAmount,
      amountPaid: 0,
      balanceDue: value.balanceDue,
      specialRequests: payload.specialRequests ?? null,
      internalNotes: value.upgradeApplied
        ? appendNote(payload.internalNotes ?? null, value.upgradeMessage || 'Upgrade aplicado al mismo precio')
        : payload.internalNotes ?? null,
      cancellationReason: payload.cancellationReason ?? null,
      cancelledByUserId: payload.cancelledByUserId ?? null,
      createdByUserId: ctx.auth.user?.id ?? null,
      updatedByUserId: ctx.auth.user?.id ?? null,
    })

    await AuditLogger.log(
      {
        action: 'CREATE',
        entity: 'reservation',
        entityId: reservation.id,
        oldValues: null,
        newValues: {
          reservationNumber: reservation.reservationNumber,
          customerId: reservation.customerId,
          roomTypeId: reservation.roomTypeId,
          roomId: reservation.roomId,
          source: reservation.source,
          status: reservation.status,
          totalAmount: reservation.totalAmount,
          balanceDue: reservation.balanceDue,
        },
        metadata: {
          source: 'admin.hotels.reservations.store',
          upgradeApplied: value.upgradeApplied,
          upgradeMessage: value.upgradeMessage,
        },
      },
      ctx
    )

    return respondSuccessOrJson(ctx, 'Reservación creada', '/admin/hotels/reservations', reservation, true)
  }

  async update(ctx: HttpContext) {
    const reservation = await Reservation.findOrFail(ctx.params.id)
    const payload = await ctx.request.validateUsing(createReservationValidator)
    const nextStatus = ((payload.status as ReservationStatus | undefined) ?? reservation.status) as ReservationStatus

    if (!canTransitionStatus(reservation.status as ReservationStatus, nextStatus)) {
      return respondConflictOrRedirect(
        ctx,
        `Transicion de estado invalida: ${reservation.status} -> ${nextStatus}`,
        `/admin/hotels/reservations/${reservation.id}/edit`,
        400
      )
    }

    if (nextStatus === 'CHECKED_IN' || nextStatus === 'CHECKED_OUT') {
      return respondConflictOrRedirect(
        ctx,
        'CHECKED_IN/CHECKED_OUT deben registrarse desde logs operativos de check-in/check-out',
        `/admin/hotels/reservations/${reservation.id}/edit`,
        400
      )
    }

    const validation = await this.applyBusinessRules(payload, reservation.id, reservation.amountPaid)
    if (validation.error) {
      return respondConflictOrRedirect(ctx, validation.error, `/admin/hotels/reservations/${reservation.id}/edit`, 400)
    }

    const value = validation.value!
    const previous = {
      status: reservation.status,
      roomId: reservation.roomId,
      checkInPlannedAt: reservation.checkInPlannedAt.toISO(),
      checkOutPlannedAt: reservation.checkOutPlannedAt.toISO(),
      totalAmount: reservation.totalAmount,
      balanceDue: reservation.balanceDue,
    }

    reservation.reservationNumber = (payload.reservationNumber || reservation.reservationNumber).trim().toUpperCase()
    reservation.customerId = payload.customerId
    reservation.roomTypeId = value.roomTypeId
    reservation.roomId = value.roomId
    reservation.appliedRoomPriceId = value.appliedRoomPriceId
    reservation.source = (payload.source as ReservationSource | undefined) ?? reservation.source
    reservation.status = nextStatus
    reservation.adultsCount = value.adults
    reservation.childrenCount = value.children
    reservation.guestsCount = value.guests
    reservation.checkInPlannedAt = value.checkIn
    reservation.checkOutPlannedAt = value.checkOut
    reservation.checkInDeadlineAt = toDateTime(payload.checkInDeadlineAt)
    reservation.expiresAt = toDateTime(payload.expiresAt)
    reservation.confirmedAt = toDateTime(payload.confirmedAt)
    reservation.cancelledAt = toDateTime(payload.cancelledAt)
    reservation.checkedInAt = toDateTime(payload.checkedInAt)
    reservation.checkedOutAt = toDateTime(payload.checkedOutAt)
    reservation.lodgingSubtotal = value.lodgingSubtotal
    reservation.discountTotal = value.discountTotal
    reservation.ivaTotal = value.ivaTotal
    reservation.tourismTaxTotal = value.tourismTaxTotal
    reservation.totalAmount = value.totalAmount
    reservation.amountPaid = reservation.amountPaid
    reservation.balanceDue = value.balanceDue
    reservation.specialRequests = payload.specialRequests ?? null
    reservation.internalNotes = value.upgradeApplied
      ? appendNote(payload.internalNotes ?? null, value.upgradeMessage || 'Upgrade aplicado al mismo precio')
      : payload.internalNotes ?? null
    reservation.cancellationReason = payload.cancellationReason ?? null
    reservation.cancelledByUserId = payload.cancelledByUserId ?? null
    reservation.updatedByUserId = ctx.auth.user?.id ?? null
    await reservation.save()

    await AuditLogger.log(
      {
        action: 'UPDATE',
        entity: 'reservation',
        entityId: reservation.id,
        oldValues: previous,
        newValues: {
          status: reservation.status,
          roomId: reservation.roomId,
          checkInPlannedAt: reservation.checkInPlannedAt.toISO(),
          checkOutPlannedAt: reservation.checkOutPlannedAt.toISO(),
          totalAmount: reservation.totalAmount,
          balanceDue: reservation.balanceDue,
        },
        metadata: {
          source: 'admin.hotels.reservations.update',
          upgradeApplied: value.upgradeApplied,
          upgradeMessage: value.upgradeMessage,
        },
      },
      ctx
    )

    return respondSuccessOrJson(ctx, 'Reservación actualizada', '/admin/hotels/reservations', reservation)
  }

  async transition(ctx: HttpContext) {
    const reservation = await Reservation.findOrFail(ctx.params.id)
    const action = String(ctx.request.input('action', '')).trim().toUpperCase() as ReservationQuickAction

    if (!['CONFIRM', 'CHECK_IN', 'CHECK_OUT', 'NO_SHOW'].includes(action)) {
      return respondConflictOrRedirect(
        ctx,
        'Accion de transicion no soportada',
        '/admin/hotels/reservations',
        400
      )
    }

    const userId = ctx.auth.user?.id ?? null
    const previous = {
      status: reservation.status,
      roomId: reservation.roomId,
      confirmedAt: reservation.confirmedAt?.toISO() ?? null,
      checkedInAt: reservation.checkedInAt?.toISO() ?? null,
      checkedOutAt: reservation.checkedOutAt?.toISO() ?? null,
    }

    const transitionError = await db.transaction(async (trx) => {
      if (action === 'CONFIRM') {
        if (!this.isConfirmableStatus(reservation.status as ReservationStatus)) {
          return `La reservacion en estado ${reservation.status} no puede confirmarse desde listado`
        }

        reservation.status = 'CONFIRMED'
        reservation.confirmedAt = reservation.confirmedAt ?? DateTime.now()
        reservation.updatedByUserId = userId
        await reservation.useTransaction(trx).save()
        return null
      }

      if (action === 'CHECK_IN') {
        if (reservation.status !== 'CONFIRMED') {
          return 'Solo una reservacion CONFIRMED puede hacer check-in'
        }

        const roomId = reservation.roomId
        if (!roomId) {
          return 'La reservacion no tiene habitacion asignada para registrar check-in'
        }

        const room = await Room.find(roomId, { client: trx })
        if (!room) {
          return 'No se encontro la habitacion asignada para registrar check-in'
        }

        if (blockedRoomStatuses.has(room.currentStatus)) {
          return 'La habitacion asignada no esta disponible operativamente para check-in'
        }

        const occurredAt = DateTime.now()
        await CheckinCheckoutLog.create(
          {
            reservationId: reservation.id,
            roomId,
            action: 'CHECK_IN',
            performedByUserId: userId,
            occurredAt,
            notes: 'Check-in generado desde acciones rapidas de reservaciones',
          },
          { client: trx }
        )

        reservation.status = 'CHECKED_IN'
        reservation.checkedInAt = occurredAt
        reservation.updatedByUserId = userId
        await reservation.useTransaction(trx).save()

        room.currentStatus = 'OCCUPIED'
        room.updatedByUserId = userId
        await room.useTransaction(trx).save()
        return null
      }

      if (action === 'CHECK_OUT') {
        if (reservation.status !== 'CHECKED_IN') {
          return 'Solo una reservacion CHECKED_IN puede hacer check-out'
        }

        const roomId = reservation.roomId
        const occurredAt = DateTime.now()

        await CheckinCheckoutLog.create(
          {
            reservationId: reservation.id,
            roomId,
            action: 'CHECK_OUT',
            performedByUserId: userId,
            occurredAt,
            notes: 'Check-out generado desde acciones rapidas de reservaciones',
          },
          { client: trx }
        )

        reservation.status = 'CHECKED_OUT'
        reservation.checkedOutAt = occurredAt
        reservation.updatedByUserId = userId
        await reservation.useTransaction(trx).save()

        if (roomId) {
          const room = await Room.find(roomId, { client: trx })
          if (room) {
            room.currentStatus = 'DIRTY'
            room.updatedByUserId = userId
            await room.useTransaction(trx).save()
          }
        }

        return null
      }

      if (action === 'NO_SHOW') {
        if (reservation.status !== 'CONFIRMED') {
          return 'Solo una reservacion CONFIRMED puede marcarse como no-show'
        }

        const occurredAt = DateTime.now()
        await CheckinCheckoutLog.create(
          {
            reservationId: reservation.id,
            roomId: reservation.roomId,
            action: 'NO_SHOW',
            performedByUserId: userId,
            occurredAt,
            notes: 'No-show generado desde acciones rapidas de reservaciones',
          },
          { client: trx }
        )

        reservation.status = 'NO_SHOW'
        reservation.updatedByUserId = userId
        await reservation.useTransaction(trx).save()

        if (reservation.roomId) {
          const room = await Room.find(reservation.roomId, { client: trx })
          if (room && room.currentStatus === 'RESERVED') {
            room.currentStatus = 'AVAILABLE_CLEAN'
            room.updatedByUserId = userId
            await room.useTransaction(trx).save()
          }
        }

        return null
      }

      return 'Accion no implementada'
    })

    if (transitionError) {
      return respondConflictOrRedirect(ctx, transitionError, '/admin/hotels/reservations', 400)
    }

    await reservation.refresh()

    await AuditLogger.log(
      {
        action: 'UPDATE',
        entity: 'reservation',
        entityId: reservation.id,
        oldValues: previous,
        newValues: {
          status: reservation.status,
          roomId: reservation.roomId,
          confirmedAt: reservation.confirmedAt?.toISO() ?? null,
          checkedInAt: reservation.checkedInAt?.toISO() ?? null,
          checkedOutAt: reservation.checkedOutAt?.toISO() ?? null,
        },
        metadata: {
          source: 'admin.hotels.reservations.transition',
          transitionAction: action,
        },
      },
      ctx
    )

    return respondSuccessOrJson(
      ctx,
      `Accion ${action} aplicada correctamente a la reservacion`,
      '/admin/hotels/reservations',
      reservation
    )
  }

  async cancel(ctx: HttpContext) {
    const reservation = await Reservation.findOrFail(ctx.params.id)
    const reason = String(ctx.request.input('cancellationReason', '')).trim()

    if (!cancellableStatuses.has(reservation.status as ReservationStatus)) {
      return respondConflictOrRedirect(
        ctx,
        `La reservación en estado ${reservation.status} no puede cancelarse desde este módulo`,
        '/admin/hotels/reservations',
        409
      )
    }

    if (!canTransitionStatus(reservation.status as ReservationStatus, 'CANCELLED')) {
      return respondConflictOrRedirect(
        ctx,
        `Transicion de estado invalida: ${reservation.status} -> CANCELLED`,
        '/admin/hotels/reservations',
        400
      )
    }

    if (reason.length < 5) {
      return respondConflictOrRedirect(
        ctx,
        'Debes indicar un motivo de cancelación de al menos 5 caracteres',
        '/admin/hotels/reservations',
        400
      )
    }

    const previous = {
      status: reservation.status,
      cancelledAt: reservation.cancelledAt?.toISO() ?? null,
      cancellationReason: reservation.cancellationReason,
      cancelledByUserId: reservation.cancelledByUserId,
    }

    reservation.status = 'CANCELLED'
    reservation.cancelledAt = DateTime.now()
    reservation.cancellationReason = reason
    reservation.cancelledByUserId = ctx.auth.user?.id ?? null
    reservation.updatedByUserId = ctx.auth.user?.id ?? null
    await reservation.save()

    let maintenanceRoomNumber: string | null = null
    if (reservation.roomId) {
      const room = await Room.find(reservation.roomId)
      if (room) {
        const roomPrevious = {
          currentStatus: room.currentStatus,
          internalNotes: room.internalNotes,
        }

        room.currentStatus = 'MAINTENANCE'
        room.updatedByUserId = ctx.auth.user?.id ?? null
        const maintenanceNote = `Reserva ${reservation.reservationNumber} cancelada: ${reason}`
        room.internalNotes = room.internalNotes
          ? `${room.internalNotes}\n${maintenanceNote}`
          : maintenanceNote
        await room.save()

        maintenanceRoomNumber = room.roomNumber

        await AuditLogger.log(
          {
            action: 'UPDATE',
            entity: 'room',
            entityId: room.id,
            oldValues: roomPrevious,
            newValues: {
              currentStatus: room.currentStatus,
              internalNotes: room.internalNotes,
            },
            metadata: {
              source: 'admin.hotels.reservations.cancel.room_maintenance',
              reservationId: reservation.id,
            },
          },
          ctx
        )
      }
    }

    await AuditLogger.log(
      {
        action: 'CANCEL',
        entity: 'reservation',
        entityId: reservation.id,
        oldValues: previous,
        newValues: {
          status: reservation.status,
          cancelledAt: reservation.cancelledAt.toISO(),
          cancellationReason: reservation.cancellationReason,
          cancelledByUserId: reservation.cancelledByUserId,
        },
        metadata: { source: 'admin.hotels.reservations.cancel' },
      },
      ctx
    )

    const successMessage = maintenanceRoomNumber
      ? `Reservación cancelada. Habitación ${maintenanceRoomNumber} marcada en mantenimiento.`
      : 'Reservación cancelada'

    return respondSuccessOrJson(ctx, successMessage, '/admin/hotels/reservations', reservation)
  }
}
