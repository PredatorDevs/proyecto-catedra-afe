import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import Reservation from '#models/reservation'
import Room from '#models/room'
import CheckinCheckoutLog from '#models/checkin_checkout_log'
import AuditLogger from '#services/audit_logger'
import { createCheckinCheckoutLogValidator } from '#validators/admin/hotels/create_checkin_checkout_log_validator'
import {
  checkinCheckoutActionLabel,
  checkinCheckoutActionOptions,
  reservationStatusLabel,
} from '#controllers/admin/hotels/ui_enum_labels'
import {
  prefersHtml,
  renderCatalogForm,
  renderCatalogIndex,
  respondConflictOrRedirect,
  respondSuccessOrJson,
  type CatalogField,
} from '#controllers/admin/hotels/ui_support'

const blockedRoomStatuses = new Set([
  'BLOCKED',
  'MAINTENANCE',
  'OUT_OF_SERVICE',
  'DIRTY',
  'CLEANING_IN_PROGRESS',
])

export default class CheckinCheckoutLogsController {
  private async fields(): Promise<CatalogField[]> {
    const [reservations, rooms] = await Promise.all([
      Reservation.query().orderBy('id', 'desc').limit(300),
      Room.query().orderBy('room_number', 'asc').limit(500),
    ])

    return [
      {
        name: 'reservationId',
        label: 'Reservacion',
        type: 'select',
        required: true,
        colSpanMd: 2,
        options: reservations.map((item) => ({
          value: item.id,
          label: `${item.id} - ${item.reservationNumber} (${reservationStatusLabel(item.status)})`,
        })),
      },
      {
        name: 'roomId',
        label: 'Habitacion (opcional)',
        type: 'select',
        options: rooms.map((item) => ({ value: item.id, label: item.roomNumber })),
      },
      {
        name: 'action',
        label: 'Accion',
        type: 'select',
        required: true,
        options: checkinCheckoutActionOptions,
      },
      { name: 'occurredAt', label: 'Fecha del evento', type: 'date', required: true },
      { name: 'notes', label: 'Notas', type: 'textarea', fullWidth: true },
    ]
  }

  async index(ctx: HttpContext) {
    const { request, response } = ctx
    const reservationId = Number(request.input('reservationId'))
    const query = CheckinCheckoutLog.query().preload('room').orderBy('occurred_at', 'desc')

    if (Number.isFinite(reservationId) && reservationId > 0) {
      query.where('reservation_id', reservationId)
    }

    const rows = await query

    if (prefersHtml(ctx)) {
      return renderCatalogIndex(ctx, {
        pageKicker: 'Reservaciones',
        pageTitle: 'Logs de Check-in / Check-out',
        pageSubtitle: 'Bitacora de movimientos operativos de las reservaciones.',
        createHref: '/admin/hotels/checkin-checkout-logs/new',
        createLabel: 'Nuevo log',
        editBaseHref: '/admin/hotels/checkin-checkout-logs',
        columns: [
          { key: 'id', label: 'ID' },
          { key: 'reservationId', label: 'Reservacion' },
          { key: 'room', label: 'Habitacion' },
          { key: 'action', label: 'Accion', badge: true },
          { key: 'occurredAt', label: 'Fecha' },
        ],
        rows: rows.map((row) => ({
          id: row.id,
          reservationId: row.reservationId,
          room: row.room?.roomNumber ?? '-',
          action: checkinCheckoutActionLabel(row.action),
          occurredAt: row.occurredAt.toFormat('yyyy-LL-dd'),
        })),
      })
    }

    return response.ok({
      data: rows.map((row) => ({
        ...row.serialize(),
        actionLabel: checkinCheckoutActionLabel(row.action),
      })),
    })
  }

  async create(ctx: HttpContext) {
    return renderCatalogForm(ctx, {
      formMode: 'create',
      formKicker: 'Reservaciones',
      formTitle: 'Nuevo log de operacion',
      formSubtitle: 'Registra check-in, check-out o cambios de habitacion.',
      formAction: '/admin/hotels/checkin-checkout-logs',
      submitLabel: 'Crear log',
      backHref: '/admin/hotels/checkin-checkout-logs',
      fields: await this.fields(),
      values: {
        reservationId: ctx.request.input('reservationId') || '',
        action: 'CHECK_IN',
        occurredAt: DateTime.now().toISODate(),
      },
    })
  }

  async edit(ctx: HttpContext) {
    const row = await CheckinCheckoutLog.findOrFail(ctx.params.id)

    return renderCatalogForm(ctx, {
      formMode: 'edit',
      formKicker: 'Reservaciones',
      formTitle: `Editar log #${row.id}`,
      formSubtitle: 'Ajusta detalles de la operacion registrada.',
      formAction: `/admin/hotels/checkin-checkout-logs/${row.id}/update`,
      submitLabel: 'Guardar cambios',
      backHref: '/admin/hotels/checkin-checkout-logs',
      fields: await this.fields(),
      values: {
        reservationId: row.reservationId,
        roomId: row.roomId,
        action: row.action,
        occurredAt: row.occurredAt.toISODate(),
        notes: row.notes,
      },
    })
  }

  async store(ctx: HttpContext) {
    const payload = await ctx.request.validateUsing(createCheckinCheckoutLogValidator)

    const reservation = await Reservation.find(payload.reservationId)
    if (!reservation) {
      return respondConflictOrRedirect(
        ctx,
        'reservationId no existe',
        '/admin/hotels/checkin-checkout-logs/new',
        400
      )
    }

    if (payload.roomId) {
      const room = await Room.find(payload.roomId)
      if (!room) {
        return respondConflictOrRedirect(
          ctx,
          'roomId no existe',
          '/admin/hotels/checkin-checkout-logs/new',
          400
        )
      }
    }

    const targetRoomId = payload.roomId ?? reservation.roomId
    if ((payload.action === 'CHECK_IN' || payload.action === 'ROOM_CHANGE_IN') && !targetRoomId) {
      return respondConflictOrRedirect(
        ctx,
        'Debe definir roomId o tener roomId asignado en la reservacion para esta accion',
        '/admin/hotels/checkin-checkout-logs/new',
        400
      )
    }

    if (payload.action === 'CHECK_IN' && reservation.status !== 'CONFIRMED') {
      return respondConflictOrRedirect(
        ctx,
        'Solo una reservacion CONFIRMED puede hacer check-in',
        '/admin/hotels/checkin-checkout-logs/new'
      )
    }

    if (payload.action === 'CHECK_OUT' && reservation.status !== 'CHECKED_IN') {
      return respondConflictOrRedirect(
        ctx,
        'Solo una reservacion CHECKED_IN puede hacer check-out',
        '/admin/hotels/checkin-checkout-logs/new'
      )
    }

    if ((payload.action === 'ROOM_CHANGE_OUT' || payload.action === 'ROOM_CHANGE_IN') && reservation.status !== 'CHECKED_IN') {
      return respondConflictOrRedirect(
        ctx,
        'Cambio de habitacion solo permitido para reservaciones CHECKED_IN',
        '/admin/hotels/checkin-checkout-logs/new'
      )
    }

    if (targetRoomId && (payload.action === 'CHECK_IN' || payload.action === 'ROOM_CHANGE_IN')) {
      const room = await Room.findOrFail(targetRoomId)
      if (blockedRoomStatuses.has(room.currentStatus)) {
        return respondConflictOrRedirect(
          ctx,
          'La habitacion no esta disponible operativamente para esta accion',
          '/admin/hotels/checkin-checkout-logs/new'
        )
      }
    }

    const row = await CheckinCheckoutLog.create({
      reservationId: payload.reservationId,
      roomId: payload.roomId ?? null,
      action: payload.action as CheckinCheckoutLog['action'],
      performedByUserId: ctx.auth.user?.id ?? null,
      occurredAt: DateTime.fromJSDate(payload.occurredAt),
      notes: payload.notes ?? null,
    })

    // Operational synchronization between logs and reservation/room lifecycle.
    if (payload.action === 'CHECK_IN') {
      const roomId = targetRoomId!
      const room = await Room.findOrFail(roomId)
      reservation.roomId = roomId
      reservation.status = 'CHECKED_IN'
      reservation.checkedInAt = row.occurredAt
      reservation.updatedByUserId = ctx.auth.user?.id ?? reservation.updatedByUserId
      room.currentStatus = 'OCCUPIED'
      room.updatedByUserId = ctx.auth.user?.id ?? room.updatedByUserId
      await reservation.save()
      await room.save()
    }

    if (payload.action === 'CHECK_OUT') {
      const roomId = targetRoomId
      reservation.status = 'CHECKED_OUT'
      reservation.checkedOutAt = row.occurredAt
      reservation.updatedByUserId = ctx.auth.user?.id ?? reservation.updatedByUserId
      await reservation.save()

      if (roomId) {
        const room = await Room.findOrFail(roomId)
        room.currentStatus = 'DIRTY'
        room.updatedByUserId = ctx.auth.user?.id ?? room.updatedByUserId
        await room.save()
      }
    }

    if (payload.action === 'ROOM_CHANGE_OUT') {
      const roomId = payload.roomId ?? reservation.roomId
      if (roomId) {
        const room = await Room.findOrFail(roomId)
        room.currentStatus = 'DIRTY'
        room.updatedByUserId = ctx.auth.user?.id ?? room.updatedByUserId
        await room.save()
      }
    }

    if (payload.action === 'ROOM_CHANGE_IN') {
      const roomId = targetRoomId!
      const room = await Room.findOrFail(roomId)
      reservation.roomId = roomId
      reservation.updatedByUserId = ctx.auth.user?.id ?? reservation.updatedByUserId
      room.currentStatus = 'OCCUPIED'
      room.updatedByUserId = ctx.auth.user?.id ?? room.updatedByUserId
      await reservation.save()
      await room.save()
    }

    if (payload.action === 'NO_SHOW') {
      reservation.status = 'NO_SHOW'
      reservation.updatedByUserId = ctx.auth.user?.id ?? reservation.updatedByUserId
      await reservation.save()

      if (reservation.roomId) {
        const room = await Room.find(reservation.roomId)
        if (room && room.currentStatus === 'RESERVED') {
          room.currentStatus = 'AVAILABLE_CLEAN'
          room.updatedByUserId = ctx.auth.user?.id ?? room.updatedByUserId
          await room.save()
        }
      }
    }

    await AuditLogger.log(
      {
        action: 'CREATE',
        entity: 'checkin_checkout_log',
        entityId: row.id,
        oldValues: null,
        newValues: {
          reservationId: row.reservationId,
          roomId: row.roomId,
          action: row.action,
          occurredAt: row.occurredAt.toISO(),
        },
        metadata: { source: 'admin.hotels.checkinCheckoutLogs.store' },
      },
      ctx
    )

    return respondSuccessOrJson(
      ctx,
      'Log de operacion creado',
      '/admin/hotels/checkin-checkout-logs',
      row,
      true
    )
  }

  async update(ctx: HttpContext) {
    const row = await CheckinCheckoutLog.findOrFail(ctx.params.id)

    if (['CHECK_IN', 'CHECK_OUT', 'ROOM_CHANGE_OUT', 'ROOM_CHANGE_IN', 'NO_SHOW'].includes(row.action)) {
      return respondConflictOrRedirect(
        ctx,
        'Los logs operativos no pueden editarse para preservar trazabilidad y sincronizacion',
        '/admin/hotels/checkin-checkout-logs'
      )
    }

    const payload = await ctx.request.validateUsing(createCheckinCheckoutLogValidator)

    const reservation = await Reservation.find(payload.reservationId)
    if (!reservation) {
      return respondConflictOrRedirect(
        ctx,
        'reservationId no existe',
        `/admin/hotels/checkin-checkout-logs/${row.id}/edit`,
        400
      )
    }

    if (payload.roomId) {
      const room = await Room.find(payload.roomId)
      if (!room) {
        return respondConflictOrRedirect(
          ctx,
          'roomId no existe',
          `/admin/hotels/checkin-checkout-logs/${row.id}/edit`,
          400
        )
      }
    }

    const previous = {
      reservationId: row.reservationId,
      roomId: row.roomId,
      action: row.action,
      occurredAt: row.occurredAt.toISO(),
    }

    row.reservationId = payload.reservationId
    row.roomId = payload.roomId ?? null
    row.action = payload.action as CheckinCheckoutLog['action']
    row.occurredAt = DateTime.fromJSDate(payload.occurredAt)
    row.notes = payload.notes ?? null
    await row.save()

    await AuditLogger.log(
      {
        action: 'UPDATE',
        entity: 'checkin_checkout_log',
        entityId: row.id,
        oldValues: previous,
        newValues: {
          reservationId: row.reservationId,
          roomId: row.roomId,
          action: row.action,
          occurredAt: row.occurredAt.toISO(),
        },
        metadata: { source: 'admin.hotels.checkinCheckoutLogs.update' },
      },
      ctx
    )

    return respondSuccessOrJson(ctx, 'Log de operacion actualizado', '/admin/hotels/checkin-checkout-logs', row)
  }
}
