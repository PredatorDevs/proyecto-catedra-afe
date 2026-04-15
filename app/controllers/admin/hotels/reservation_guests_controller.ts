import type { HttpContext } from '@adonisjs/core/http'
import Reservation from '#models/reservation'
import ReservationGuest from '#models/reservation_guest'
import AuditLogger from '#services/audit_logger'
import { createReservationGuestValidator } from '#validators/admin/hotels/create_reservation_guest_validator'
import {
  reservationGuestTypeLabel,
  reservationGuestTypeOptions,
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

export default class ReservationGuestsController {
  private async fields(): Promise<CatalogField[]> {
    const reservations = await Reservation.query().orderBy('id', 'desc').limit(300)

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
        name: 'guestType',
        label: 'Tipo de huesped',
        type: 'select',
        required: true,
        options: reservationGuestTypeOptions,
      },
      { name: 'fullName', label: 'Nombre completo', required: true, colSpanMd: 2 },
      { name: 'email', label: 'Correo', type: 'email' },
      { name: 'phone', label: 'Telefono' },
      {
        name: 'documentType',
        label: 'Tipo documento',
        type: 'select',
        options: [
          { value: 'DUI', label: 'DUI' },
          { value: 'PASSPORT', label: 'Pasaporte' },
          { value: 'NIT', label: 'NIT' },
          { value: 'OTHER', label: 'Otro' },
        ],
      },
      { name: 'documentNumber', label: 'Numero documento' },
      { name: 'isResponsible', label: 'Responsable de reserva', type: 'checkbox' },
      { name: 'notes', label: 'Notas', type: 'textarea', fullWidth: true },
    ]
  }

  async index(ctx: HttpContext) {
    const { request, response } = ctx
    const reservationId = Number(request.input('reservationId'))
    const query = ReservationGuest.query().orderBy('id', 'asc')

    if (Number.isFinite(reservationId) && reservationId > 0) {
      query.where('reservation_id', reservationId)
    }

    const rows = await query

    if (prefersHtml(ctx)) {
      return renderCatalogIndex(ctx, {
        pageKicker: 'Reservaciones',
        pageTitle: 'Huespedes de Reservacion',
        pageSubtitle: 'Administra huesped principal y acompanantes por cada reserva.',
        createHref: '/admin/hotels/reservation-guests/new',
        createLabel: 'Nuevo huesped',
        editBaseHref: '/admin/hotels/reservation-guests',
        columns: [
          { key: 'id', label: 'ID' },
          { key: 'reservationId', label: 'Reservacion' },
          { key: 'guestType', label: 'Tipo', badge: true },
          { key: 'fullName', label: 'Nombre' },
          { key: 'email', label: 'Correo' },
          { key: 'isResponsible', label: 'Responsable', badge: true },
        ],
        rows: rows.map((row) => ({
          id: row.id,
          reservationId: row.reservationId,
          guestType: reservationGuestTypeLabel(row.guestType),
          fullName: row.fullName,
          email: row.email ?? '-',
          isResponsible: row.isResponsible ? 'Si' : 'No',
        })),
      })
    }

    return response.ok({
      data: rows.map((row) => ({
        ...row.serialize(),
        guestTypeLabel: reservationGuestTypeLabel(row.guestType),
      })),
    })
  }

  async create(ctx: HttpContext) {
    return renderCatalogForm(ctx, {
      formMode: 'create',
      formKicker: 'Reservaciones',
      formTitle: 'Nuevo huesped de reservacion',
      formSubtitle: 'Registra titular o acompanante asociado a una reserva.',
      formAction: '/admin/hotels/reservation-guests',
      submitLabel: 'Crear huesped',
      backHref: '/admin/hotels/reservation-guests',
      fields: await this.fields(),
      values: {
        reservationId: ctx.request.input('reservationId') || '',
        guestType: 'ADDITIONAL',
        isResponsible: false,
      },
    })
  }

  async edit(ctx: HttpContext) {
    const row = await ReservationGuest.findOrFail(ctx.params.id)

    return renderCatalogForm(ctx, {
      formMode: 'edit',
      formKicker: 'Reservaciones',
      formTitle: `Editar huesped #${row.id}`,
      formSubtitle: 'Actualiza informacion de identificacion y responsabilidad.',
      formAction: `/admin/hotels/reservation-guests/${row.id}/update`,
      submitLabel: 'Guardar cambios',
      backHref: '/admin/hotels/reservation-guests',
      fields: await this.fields(),
      values: {
        reservationId: row.reservationId,
        guestType: row.guestType,
        fullName: row.fullName,
        email: row.email,
        phone: row.phone,
        documentType: row.documentType,
        documentNumber: row.documentNumber,
        isResponsible: row.isResponsible,
        notes: row.notes,
      },
    })
  }

  async store(ctx: HttpContext) {
    const payload = await ctx.request.validateUsing(createReservationGuestValidator)

    const reservation = await Reservation.find(payload.reservationId)
    if (!reservation) {
      return respondConflictOrRedirect(ctx, 'reservationId no existe', '/admin/hotels/reservation-guests/new', 400)
    }

    if (payload.guestType === 'PRIMARY') {
      const primary = await ReservationGuest.query()
        .where('reservation_id', payload.reservationId)
        .where('guest_type', 'PRIMARY')
        .first()
      if (primary) {
        return respondConflictOrRedirect(
          ctx,
          'La reservacion ya tiene huesped principal',
          '/admin/hotels/reservation-guests/new'
        )
      }
    }

    const row = await ReservationGuest.create({
      reservationId: payload.reservationId,
      guestType: (payload.guestType as ReservationGuest['guestType'] | undefined) ?? 'ADDITIONAL',
      fullName: payload.fullName,
      email: payload.email ?? null,
      phone: payload.phone ?? null,
      documentType: (payload.documentType as ReservationGuest['documentType']) ?? null,
      documentNumber: payload.documentNumber ?? null,
      isResponsible: payload.isResponsible ?? false,
      notes: payload.notes ?? null,
    })

    await AuditLogger.log(
      {
        action: 'CREATE',
        entity: 'reservation_guest',
        entityId: row.id,
        oldValues: null,
        newValues: {
          reservationId: row.reservationId,
          guestType: row.guestType,
          fullName: row.fullName,
          isResponsible: row.isResponsible,
        },
        metadata: { source: 'admin.hotels.reservationGuests.store' },
      },
      ctx
    )

    return respondSuccessOrJson(
      ctx,
      'Huesped de reservacion creado',
      '/admin/hotels/reservation-guests',
      row,
      true
    )
  }

  async update(ctx: HttpContext) {
    const row = await ReservationGuest.findOrFail(ctx.params.id)
    const payload = await ctx.request.validateUsing(createReservationGuestValidator)

    if (payload.reservationId !== row.reservationId) {
      const reservation = await Reservation.find(payload.reservationId)
      if (!reservation) {
        return respondConflictOrRedirect(
          ctx,
          'reservationId no existe',
          `/admin/hotels/reservation-guests/${row.id}/edit`,
          400
        )
      }
    }

    if (payload.guestType === 'PRIMARY') {
      const primary = await ReservationGuest.query()
        .where('reservation_id', payload.reservationId)
        .where('guest_type', 'PRIMARY')
        .whereNot('id', row.id)
        .first()
      if (primary) {
        return respondConflictOrRedirect(
          ctx,
          'La reservacion ya tiene otro huesped principal',
          `/admin/hotels/reservation-guests/${row.id}/edit`
        )
      }
    }

    const previous = {
      reservationId: row.reservationId,
      guestType: row.guestType,
      fullName: row.fullName,
      isResponsible: row.isResponsible,
    }

    row.reservationId = payload.reservationId
    row.guestType = (payload.guestType as ReservationGuest['guestType'] | undefined) ?? row.guestType
    row.fullName = payload.fullName
    row.email = payload.email ?? null
    row.phone = payload.phone ?? null
    row.documentType = (payload.documentType as ReservationGuest['documentType']) ?? null
    row.documentNumber = payload.documentNumber ?? null
    row.isResponsible = payload.isResponsible ?? row.isResponsible
    row.notes = payload.notes ?? null
    await row.save()

    await AuditLogger.log(
      {
        action: 'UPDATE',
        entity: 'reservation_guest',
        entityId: row.id,
        oldValues: previous,
        newValues: {
          reservationId: row.reservationId,
          guestType: row.guestType,
          fullName: row.fullName,
          isResponsible: row.isResponsible,
        },
        metadata: { source: 'admin.hotels.reservationGuests.update' },
      },
      ctx
    )

    return respondSuccessOrJson(
      ctx,
      'Huesped de reservacion actualizado',
      '/admin/hotels/reservation-guests',
      row
    )
  }
}
