import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import Reservation from '#models/reservation'
import AdditionalChargeCatalog from '#models/additional_charge_catalog'
import ReservationCharge from '#models/reservation_charge'
import AuditLogger from '#services/audit_logger'
import { createReservationChargeValidator } from '#validators/admin/hotels/create_reservation_charge_validator'
import {
  chargeKindLabel,
  chargeKindOptions,
  reservationChargeStatusLabel,
  reservationChargeStatusOptions,
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

function asMoney(value: number | undefined, fallback = 0) {
  if (typeof value !== 'number' || Number.isNaN(value)) return fallback
  return value
}

function computeTotals(unitPrice: number, quantity: number, ivaTotal?: number, tourismTaxTotal?: number) {
  const subtotal = unitPrice * quantity
  const iva = asMoney(ivaTotal)
  const tourismTax = asMoney(tourismTaxTotal)
  const totalAmount = subtotal + iva + tourismTax
  return { subtotal, iva, tourismTax, totalAmount }
}

export default class ReservationChargesController {
  private async fields(): Promise<CatalogField[]> {
    const [reservations, catalog] = await Promise.all([
      Reservation.query().orderBy('id', 'desc').limit(300),
      AdditionalChargeCatalog.query().orderBy('name', 'asc').limit(300),
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
        name: 'chargeCatalogId',
        label: 'Catalogo (opcional)',
        type: 'select',
        colSpanMd: 2,
        options: catalog.map((item) => ({ value: item.id, label: `${item.chargeCode} - ${item.name}` })),
      },
      { name: 'chargeKind', label: 'Tipo cargo', type: 'select', options: chargeKindOptions },
      {
        name: 'chargeStatus',
        label: 'Estado cargo',
        type: 'select',
        options: reservationChargeStatusOptions,
      },
      { name: 'concept', label: 'Concepto', required: true, colSpanMd: 2 },
      { name: 'quantity', label: 'Cantidad', type: 'number', min: 0.01, step: '0.01' },
      { name: 'unitPrice', label: 'Precio unitario', type: 'number', min: 0, step: '0.01' },
      { name: 'subtotal', label: 'Subtotal', type: 'number', min: 0, step: '0.01' },
      { name: 'ivaTotal', label: 'IVA', type: 'number', min: 0, step: '0.01' },
      { name: 'tourismTaxTotal', label: 'Impuesto turismo', type: 'number', min: 0, step: '0.01' },
      { name: 'totalAmount', label: 'Total', type: 'number', min: 0, step: '0.01' },
      { name: 'consumedAt', label: 'Fecha consumo', type: 'date' },
      { name: 'voidReason', label: 'Motivo anulacion', type: 'textarea', fullWidth: true },
    ]
  }

  async index(ctx: HttpContext) {
    const { request, response } = ctx
    const reservationId = Number(request.input('reservationId'))
    const query = ReservationCharge.query().orderBy('id', 'desc')

    if (Number.isFinite(reservationId) && reservationId > 0) {
      query.where('reservation_id', reservationId)
    }

    const rows = await query

    if (prefersHtml(ctx)) {
      return renderCatalogIndex(ctx, {
        pageKicker: 'Reservaciones',
        pageTitle: 'Cargos por Reservacion',
        pageSubtitle: 'Controla consumos, penalidades y cargos facturables por reserva.',
        createHref: '/admin/hotels/reservation-charges/new',
        createLabel: 'Nuevo cargo',
        editBaseHref: '/admin/hotels/reservation-charges',
        columns: [
          { key: 'id', label: 'ID' },
          { key: 'reservationId', label: 'Reservacion' },
          { key: 'chargeKind', label: 'Tipo', badge: true },
          { key: 'chargeStatus', label: 'Estado', badge: true },
          { key: 'concept', label: 'Concepto' },
          { key: 'totalAmount', label: 'Total' },
        ],
        rows: rows.map((row) => ({
          id: row.id,
          reservationId: row.reservationId,
          chargeKind: chargeKindLabel(row.chargeKind),
          chargeStatus: reservationChargeStatusLabel(row.chargeStatus),
          concept: row.concept,
          totalAmount: Number(row.totalAmount).toFixed(2),
        })),
      })
    }

    return response.ok({
      data: rows.map((row) => ({
        ...row.serialize(),
        chargeKindLabel: chargeKindLabel(row.chargeKind),
        chargeStatusLabel: reservationChargeStatusLabel(row.chargeStatus),
      })),
    })
  }

  async create(ctx: HttpContext) {
    return renderCatalogForm(ctx, {
      formMode: 'create',
      formKicker: 'Reservaciones',
      formTitle: 'Nuevo cargo de reservacion',
      formSubtitle: 'Registra consumos o penalidades aplicables a una reserva.',
      formAction: '/admin/hotels/reservation-charges',
      submitLabel: 'Crear cargo',
      backHref: '/admin/hotels/reservation-charges',
      fields: await this.fields(),
      values: {
        reservationId: ctx.request.input('reservationId') || '',
        chargeKind: 'SERVICE',
        chargeStatus: 'PENDING',
        quantity: 1,
        unitPrice: 0,
        subtotal: 0,
        ivaTotal: 0,
        tourismTaxTotal: 0,
        totalAmount: 0,
      },
    })
  }

  async edit(ctx: HttpContext) {
    const row = await ReservationCharge.findOrFail(ctx.params.id)

    return renderCatalogForm(ctx, {
      formMode: 'edit',
      formKicker: 'Reservaciones',
      formTitle: `Editar cargo #${row.id}`,
      formSubtitle: 'Actualiza estado, importes y contexto del cargo.',
      formAction: `/admin/hotels/reservation-charges/${row.id}/update`,
      submitLabel: 'Guardar cambios',
      backHref: '/admin/hotels/reservation-charges',
      fields: await this.fields(),
      values: {
        reservationId: row.reservationId,
        chargeCatalogId: row.chargeCatalogId,
        chargeKind: row.chargeKind,
        chargeStatus: row.chargeStatus,
        concept: row.concept,
        quantity: row.quantity,
        unitPrice: row.unitPrice,
        subtotal: row.subtotal,
        ivaTotal: row.ivaTotal,
        tourismTaxTotal: row.tourismTaxTotal,
        totalAmount: row.totalAmount,
        consumedAt: row.consumedAt?.toISODate(),
        voidReason: row.voidReason,
      },
    })
  }

  async store(ctx: HttpContext) {
    const payload = await ctx.request.validateUsing(createReservationChargeValidator)

    const requestedStatus =
      (payload.chargeStatus as ReservationCharge['chargeStatus'] | undefined) ?? 'PENDING'

    if (requestedStatus === 'VOIDED') {
      return respondConflictOrRedirect(
        ctx,
        'No se permite crear cargos directamente en estado VOIDED',
        '/admin/hotels/reservation-charges/new',
        400
      )
    }

    const reservation = await Reservation.find(payload.reservationId)
    if (!reservation) {
      return respondConflictOrRedirect(ctx, 'reservationId no existe', '/admin/hotels/reservation-charges/new', 400)
    }

    if (payload.chargeCatalogId) {
      const catalog = await AdditionalChargeCatalog.find(payload.chargeCatalogId)
      if (!catalog) {
        return respondConflictOrRedirect(
          ctx,
          'chargeCatalogId no existe',
          '/admin/hotels/reservation-charges/new',
          400
        )
      }
    }

    const quantity = payload.quantity ?? 1
    if (quantity <= 0) {
      return respondConflictOrRedirect(ctx, 'quantity debe ser mayor a 0', '/admin/hotels/reservation-charges/new', 400)
    }

    const unitPrice = asMoney(payload.unitPrice)
    const totals = computeTotals(unitPrice, quantity, payload.ivaTotal, payload.tourismTaxTotal)

    const row = await ReservationCharge.create({
      reservationId: payload.reservationId,
      chargeCatalogId: payload.chargeCatalogId ?? null,
      chargeKind: (payload.chargeKind as ReservationCharge['chargeKind'] | undefined) ?? 'SERVICE',
      chargeStatus: requestedStatus,
      concept: payload.concept,
      quantity,
      unitPrice,
      subtotal: payload.subtotal ?? totals.subtotal,
      ivaTotal: payload.ivaTotal ?? totals.iva,
      tourismTaxTotal: payload.tourismTaxTotal ?? totals.tourismTax,
      totalAmount: payload.totalAmount ?? totals.totalAmount,
      consumedAt: payload.consumedAt ? DateTime.fromJSDate(payload.consumedAt) : null,
      addedByUserId: payload.addedByUserId ?? ctx.auth.user?.id ?? null,
      voidedByUserId: payload.voidedByUserId ?? null,
      voidReason: payload.voidReason ?? null,
    })

    await AuditLogger.log(
      {
        action: 'CREATE',
        entity: 'reservation_charge',
        entityId: row.id,
        oldValues: null,
        newValues: {
          reservationId: row.reservationId,
          chargeKind: row.chargeKind,
          chargeStatus: row.chargeStatus,
          concept: row.concept,
          totalAmount: row.totalAmount,
        },
        metadata: { source: 'admin.hotels.reservationCharges.store' },
      },
      ctx
    )

    return respondSuccessOrJson(ctx, 'Cargo de reservacion creado', '/admin/hotels/reservation-charges', row, true)
  }

  async update(ctx: HttpContext) {
    const row = await ReservationCharge.findOrFail(ctx.params.id)
    const payload = await ctx.request.validateUsing(createReservationChargeValidator)

    if (['PAID', 'BILLED', 'VOIDED'].includes(row.chargeStatus)) {
      return respondConflictOrRedirect(
        ctx,
        'No se permite editar cargos cerrados (PAID, BILLED, VOIDED)',
        `/admin/hotels/reservation-charges/${row.id}/edit`
      )
    }

    if (payload.reservationId !== row.reservationId) {
      const reservation = await Reservation.find(payload.reservationId)
      if (!reservation) {
        return respondConflictOrRedirect(
          ctx,
          'reservationId no existe',
          `/admin/hotels/reservation-charges/${row.id}/edit`,
          400
        )
      }
    }

    if (payload.chargeCatalogId) {
      const catalog = await AdditionalChargeCatalog.find(payload.chargeCatalogId)
      if (!catalog) {
        return respondConflictOrRedirect(
          ctx,
          'chargeCatalogId no existe',
          `/admin/hotels/reservation-charges/${row.id}/edit`,
          400
        )
      }
    }

    const quantity = payload.quantity ?? row.quantity
    const unitPrice = asMoney(payload.unitPrice, row.unitPrice)
    const nextStatus =
      (payload.chargeStatus as ReservationCharge['chargeStatus'] | undefined) ?? row.chargeStatus

    if (nextStatus === 'VOIDED') {
      const voidReason = (payload.voidReason ?? '').trim()
      const voidedByUserId = payload.voidedByUserId ?? ctx.auth.user?.id ?? null
      if (!voidReason || !voidedByUserId) {
        return respondConflictOrRedirect(
          ctx,
          'Para VOIDED se requiere voidReason y usuario responsable de anulacion',
          `/admin/hotels/reservation-charges/${row.id}/edit`,
          400
        )
      }
    }

    const totals = computeTotals(
      unitPrice,
      quantity,
      payload.ivaTotal ?? row.ivaTotal,
      payload.tourismTaxTotal ?? row.tourismTaxTotal
    )

    const previous = {
      reservationId: row.reservationId,
      chargeStatus: row.chargeStatus,
      concept: row.concept,
      totalAmount: row.totalAmount,
    }

    row.reservationId = payload.reservationId
    row.chargeCatalogId = payload.chargeCatalogId ?? null
    row.chargeKind = (payload.chargeKind as ReservationCharge['chargeKind'] | undefined) ?? row.chargeKind
    row.chargeStatus = nextStatus
    row.concept = payload.concept
    row.quantity = quantity
    row.unitPrice = unitPrice
    row.subtotal = payload.subtotal ?? totals.subtotal
    row.ivaTotal = payload.ivaTotal ?? totals.iva
    row.tourismTaxTotal = payload.tourismTaxTotal ?? totals.tourismTax
    row.totalAmount = payload.totalAmount ?? totals.totalAmount
    row.consumedAt = payload.consumedAt ? DateTime.fromJSDate(payload.consumedAt) : row.consumedAt
    row.addedByUserId = payload.addedByUserId ?? row.addedByUserId

    if (nextStatus === 'VOIDED') {
      row.voidedByUserId = payload.voidedByUserId ?? ctx.auth.user?.id ?? row.voidedByUserId
      row.voidReason = payload.voidReason ?? row.voidReason
    }

    await row.save()

    await AuditLogger.log(
      {
        action: 'UPDATE',
        entity: 'reservation_charge',
        entityId: row.id,
        oldValues: previous,
        newValues: {
          reservationId: row.reservationId,
          chargeStatus: row.chargeStatus,
          concept: row.concept,
          totalAmount: row.totalAmount,
        },
        metadata: { source: 'admin.hotels.reservationCharges.update' },
      },
      ctx
    )

    return respondSuccessOrJson(ctx, 'Cargo de reservacion actualizado', '/admin/hotels/reservation-charges', row)
  }
}
