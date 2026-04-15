import type { HttpContext } from '@adonisjs/core/http'
import PaymentReservationAllocation from '#models/payment_reservation_allocation'
import Payment from '#models/payment'
import Reservation from '#models/reservation'
import db from '@adonisjs/lucid/services/db'
import AuditLogger from '#services/audit_logger'
import { createPaymentReservationAllocationValidator } from '#validators/admin/hotels/create_payment_reservation_allocation_validator'
import {
  prefersHtml,
  renderCatalogForm,
  renderCatalogIndex,
  respondConflictOrRedirect,
  respondSuccessOrJson,
  type CatalogField,
} from '#controllers/admin/hotels/ui_support'

export default class PaymentReservationAllocationsController {
  private toDecimal(value: unknown) {
    const parsed = parseFloat(String(value))
    return Number.isFinite(parsed) ? parsed : NaN
  }

  private async fields(): Promise<CatalogField[]> {
    const [payments, reservations] = await Promise.all([
      Payment.query().orderBy('id', 'desc').limit(300),
      Reservation.query().orderBy('id', 'desc').limit(300),
    ])

    return [
      {
        name: 'paymentId',
        label: 'Pago',
        type: 'select',
        required: true,
        options: payments.map((item) => ({ value: item.id, label: `${item.id} - ${item.paymentNumber}` })),
      },
      {
        name: 'reservationId',
        label: 'Reservacion',
        type: 'select',
        required: true,
        options: reservations.map((item) => ({ value: item.id, label: `${item.id} - ${item.reservationNumber}` })),
      },
      { name: 'amount', label: 'Monto aplicado', type: 'number', min: 0.01, step: '0.01', required: true },
    ]
  }

  async index(ctx: HttpContext) {
    const rows = await PaymentReservationAllocation.query()
      .preload('payment')
      .preload('reservation')
      .orderBy('id', 'desc')

    if (prefersHtml(ctx)) {
      return renderCatalogIndex(ctx, {
        pageKicker: 'Pagos',
        pageTitle: 'Asignaciones a Reservacion',
        pageSubtitle: 'Distribuye un pago hacia reservaciones especificas de forma auditable.',
        createHref: '/admin/hotels/payment-reservation-allocations/new',
        createLabel: 'Nueva asignacion',
        editBaseHref: '/admin/hotels/payment-reservation-allocations',
        columns: [
          { key: 'id', label: 'ID' },
          { key: 'payment', label: 'Pago' },
          { key: 'reservation', label: 'Reservacion' },
          { key: 'amount', label: 'Monto' },
        ],
        rows: rows.map((row) => ({
          id: row.id,
          payment: row.payment.paymentNumber,
          reservation: row.reservation.reservationNumber,
          amount: Number(row.amount).toFixed(2),
        })),
      })
    }

    return ctx.response.ok({ data: rows })
  }

  async create(ctx: HttpContext) {
    return renderCatalogForm(ctx, {
      formMode: 'create',
      formKicker: 'Pagos',
      formTitle: 'Nueva asignacion a reservacion',
      formSubtitle: 'Registra como se aplica un pago a una reservacion concreta.',
      formAction: '/admin/hotels/payment-reservation-allocations',
      submitLabel: 'Crear asignacion',
      backHref: '/admin/hotels/payment-reservation-allocations',
      fields: await this.fields(),
      values: {
        paymentId: ctx.request.input('paymentId') || '',
        reservationId: ctx.request.input('reservationId') || '',
        amount: 0.01,
      },
    })
  }

  async edit(ctx: HttpContext) {
    const row = await PaymentReservationAllocation.findOrFail(ctx.params.id)

    return renderCatalogForm(ctx, {
      formMode: 'edit',
      formKicker: 'Pagos',
      formTitle: `Editar asignacion #${row.id}`,
      formSubtitle: 'Actualiza la distribucion aplicada del pago.',
      formAction: `/admin/hotels/payment-reservation-allocations/${row.id}/update`,
      submitLabel: 'Guardar cambios',
      backHref: '/admin/hotels/payment-reservation-allocations',
      fields: await this.fields(),
      values: {
        paymentId: row.paymentId,
        reservationId: row.reservationId,
        amount: row.amount,
      },
    })
  }

  private async validateAllocation(
    paymentId: number,
    reservationId: number,
    amount: number,
    redirect: string,
    ctx: HttpContext,
    currentId?: number
  ) {
    const [payment, reservation] = await Promise.all([Payment.find(paymentId), Reservation.find(reservationId)])

    if (!payment) return respondConflictOrRedirect(ctx, 'paymentId no existe', redirect, 400)
    if (!reservation) return respondConflictOrRedirect(ctx, 'reservationId no existe', redirect, 400)

    const duplicateQuery = PaymentReservationAllocation.query()
      .where('paymentId', paymentId)
      .where('reservationId', reservationId)

    if (currentId) duplicateQuery.whereNot('id', currentId)

    const duplicate = await duplicateQuery.first()
    if (duplicate) {
      return respondConflictOrRedirect(ctx, 'La asignacion para pago/reservacion ya existe', redirect, 409)
    }

    const usedAmountQuery = db.from('payment_reservation_allocations').where('payment_id', paymentId)
    if (currentId) usedAmountQuery.whereNot('id', currentId)
    const usedAmountRow = await usedAmountQuery.sum('amount as total').first()

    const usedAmount = this.toDecimal(usedAmountRow?.total ?? 0)
    const paymentAmount = this.toDecimal(payment.amount)

    if (!Number.isFinite(usedAmount)) {
      return respondConflictOrRedirect(ctx, 'No se pudo calcular el total ya asignado del pago', redirect, 400)
    }

    if (!Number.isFinite(paymentAmount)) {
      return respondConflictOrRedirect(ctx, 'El monto del pago no es valido para asignaciones', redirect, 400)
    }

    if (usedAmount + amount > paymentAmount) {
      return respondConflictOrRedirect(ctx, 'Las asignaciones superan el monto total del pago', redirect, 400)
    }

    return null
  }

  async store(ctx: HttpContext) {
    const payload = await ctx.request.validateUsing(createPaymentReservationAllocationValidator)

    const validationError = await this.validateAllocation(
      payload.paymentId,
      payload.reservationId,
      payload.amount,
      '/admin/hotels/payment-reservation-allocations/new',
      ctx
    )
    if (validationError) return validationError

    let row: PaymentReservationAllocation
    try {
      row = await PaymentReservationAllocation.create(payload)
    } catch (error) {
      const message = error instanceof Error ? error.message : ''
      if (message.includes('Duplicate entry')) {
        return respondConflictOrRedirect(
          ctx,
          'La asignacion para pago/reservacion ya existe',
          '/admin/hotels/payment-reservation-allocations/new',
          409
        )
      }

      throw error
    }

    await AuditLogger.log(
      {
        action: 'CREATE',
        entity: 'payment_reservation_allocation',
        entityId: row.id,
        oldValues: null,
        newValues: row.serialize(),
        metadata: { source: 'admin.hotels.paymentReservationAllocations.store' },
      },
      ctx
    )

    return respondSuccessOrJson(
      ctx,
      'Asignacion a reservacion creada',
      '/admin/hotels/payment-reservation-allocations',
      row,
      true
    )
  }

  async update(ctx: HttpContext) {
    const row = await PaymentReservationAllocation.findOrFail(ctx.params.id)
    const payload = await ctx.request.validateUsing(createPaymentReservationAllocationValidator)

    const validationError = await this.validateAllocation(
      payload.paymentId,
      payload.reservationId,
      payload.amount,
      `/admin/hotels/payment-reservation-allocations/${row.id}/edit`,
      ctx,
      row.id
    )
    if (validationError) return validationError

    const previous = row.serialize()
    row.merge(payload)

    try {
      await row.save()
    } catch (error) {
      const message = error instanceof Error ? error.message : ''
      if (message.includes('Duplicate entry')) {
        return respondConflictOrRedirect(
          ctx,
          'La asignacion para pago/reservacion ya existe',
          `/admin/hotels/payment-reservation-allocations/${row.id}/edit`,
          409
        )
      }

      throw error
    }

    await AuditLogger.log(
      {
        action: 'UPDATE',
        entity: 'payment_reservation_allocation',
        entityId: row.id,
        oldValues: previous,
        newValues: row.serialize(),
        metadata: { source: 'admin.hotels.paymentReservationAllocations.update' },
      },
      ctx
    )

    return respondSuccessOrJson(
      ctx,
      'Asignacion a reservacion actualizada',
      '/admin/hotels/payment-reservation-allocations',
      row
    )
  }
}
