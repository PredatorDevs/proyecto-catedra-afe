import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import Reservation from '#models/reservation'
import Customer from '#models/customer'
import RoomType from '#models/room_type'
import Room from '#models/room'
import RoomPrice from '#models/room_price'
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

const blockedRoomStatuses = new Set([
  'BLOCKED',
  'MAINTENANCE',
  'OUT_OF_SERVICE',
  'DIRTY',
  'CLEANING_IN_PROGRESS',
])

const nonOverlappingStatuses = ['CANCELLED', 'EXPIRED', 'NO_SHOW', 'CHECKED_OUT', 'REFUNDED']

const creatableStatuses: ReservationStatus[] = [
  'DRAFT',
  'PENDING_ADMIN_CONFIRMATION',
  'PENDING_PAYMENT',
  'PAYMENT_UNDER_REVIEW',
  'CONFIRMED',
]

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

export default class ReservationsController {
  async index(ctx: HttpContext) {
    const rows = await Reservation.query()
      .preload('customer')
      .preload('roomType')
      .preload('room')
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
          { key: 'source', label: 'Origen', badge: true },
          { key: 'status', label: 'Estado', badge: true },
          { key: 'range', label: 'Fechas' },
          { key: 'totalAmount', label: 'Total' },
        ],
        rows: rows.map((row) => ({
          id: row.id,
          reservationNumber: row.reservationNumber,
          customer: row.customer.fullName,
          roomType: row.room ? `${row.roomType.code}/${row.room.roomNumber}` : row.roomType.code,
          source: reservationSourceLabel(row.source),
          status: reservationStatusLabel(row.status),
          range: `${row.checkInPlannedAt.toFormat('yyyy-LL-dd')} -> ${row.checkOutPlannedAt.toFormat('yyyy-LL-dd')}`,
          totalAmount: Number(row.totalAmount).toFixed(2),
        })),
      })
    }

    return ctx.response.ok({ data: rows })
  }

  private async fields(): Promise<CatalogField[]> {
    const [customers, roomTypes, rooms, roomPrices] = await Promise.all([
      Customer.query().orderBy('full_name', 'asc'),
      RoomType.query().orderBy('code', 'asc'),
      Room.query().preload('roomType').orderBy('room_number', 'asc'),
      RoomPrice.query().preload('roomType').orderBy('id', 'desc').limit(200),
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
        options: roomTypes.map((item) => ({ value: item.id, label: `${item.code} - ${item.name}` })),
      },
      {
        name: 'roomId',
        label: 'Habitación específica (opcional)',
        type: 'select',
        colSpanMd: 2,
        colSpanXl: 1,
        options: rooms.map((item) => ({
          value: item.id,
          label: `${item.roomNumber} - ${item.roomType.code}`,
        })),
      },
      {
        name: 'appliedRoomPriceId',
        label: 'Tarifa aplicada (opcional)',
        type: 'select',
        colSpanMd: 2,
        colSpanXl: 2,
        options: roomPrices.map((item) => ({
          value: item.id,
          label: `#${item.id} ${item.name} (${item.roomType.code})`,
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
      { name: 'lodgingSubtotal', label: 'Subtotal hospedaje', type: 'number', min: 0, step: '0.01' },
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

    return renderCatalogForm(ctx, {
      formMode: 'edit',
      formKicker: 'Reservaciones',
      formTitle: `Editar reservación #${row.id}`,
      formSubtitle: 'Actualiza estado, fechas, habitación y montos de la reservación.',
      formAction: `/admin/hotels/reservations/${row.id}/update`,
      submitLabel: 'Guardar cambios',
      backHref: '/admin/hotels/reservations',
      fields: await this.fields(),
      values: {
        reservationNumber: row.reservationNumber,
        customerId: row.customerId,
        roomTypeId: row.roomTypeId,
        roomId: row.roomId,
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

    let roomId: number | null = payload.roomId ?? null
    if (roomId) {
      const room = await Room.find(roomId)
      if (!room) {
        return { error: 'roomId no existe' }
      }

      if (room.roomTypeId !== payload.roomTypeId) {
        return { error: 'roomId no pertenece al roomTypeId enviado' }
      }

      if (blockedRoomStatuses.has(room.currentStatus)) {
        return { error: 'La habitación seleccionada no está disponible operativamente' }
      }

      const overlapQuery = Reservation.query()
        .where('room_id', roomId)
        .whereNotIn('status', nonOverlappingStatuses)
        .where('check_in_planned_at', '<', checkOut.toSQL()!)
        .where('check_out_planned_at', '>', checkIn.toSQL()!)

      if (currentId !== undefined) {
        overlapQuery.whereNot('id', currentId)
      }

      const overlap = await overlapQuery.first()

      if (overlap) {
        return { error: 'Existe una reservación solapada para la habitación seleccionada' }
      }
    }

    let appliedRoomPriceId: number | null = payload.appliedRoomPriceId ?? null
    if (appliedRoomPriceId) {
      const price = await RoomPrice.find(appliedRoomPriceId)
      if (!price) {
        return { error: 'appliedRoomPriceId no existe' }
      }

      if (price.roomTypeId !== payload.roomTypeId) {
        return { error: 'La tarifa aplicada no corresponde al tipo de habitación seleccionado' }
      }
    }

    const adults = payload.adultsCount ?? 1
    const children = payload.childrenCount ?? 0
    const guests = payload.guestsCount ?? adults + children
    if (guests < adults || guests < 1) {
      return { error: 'guestsCount debe ser mayor o igual al total de adultos y al menos 1' }
    }

    const lodgingSubtotal = toMoney(payload.lodgingSubtotal)
    const discountTotal = toMoney(payload.discountTotal)
    const ivaTotal = toMoney(payload.ivaTotal)
    const tourismTaxTotal = toMoney(payload.tourismTaxTotal)
    const amountPaid = toMoney(currentAmountPaid)

    const totalAmount = Math.max(0, lodgingSubtotal - discountTotal + ivaTotal + tourismTaxTotal)
    const balanceDue = Math.max(0, totalAmount - amountPaid)

    return {
      value: {
        roomId,
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
      roomTypeId: payload.roomTypeId,
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
      internalNotes: payload.internalNotes ?? null,
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
        metadata: { source: 'admin.hotels.reservations.store' },
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
    reservation.roomTypeId = payload.roomTypeId
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
    reservation.internalNotes = payload.internalNotes ?? null
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
        metadata: { source: 'admin.hotels.reservations.update' },
      },
      ctx
    )

    return respondSuccessOrJson(ctx, 'Reservación actualizada', '/admin/hotels/reservations', reservation)
  }
}
