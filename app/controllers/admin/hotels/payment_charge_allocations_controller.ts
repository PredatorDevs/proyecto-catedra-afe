import type { HttpContext } from '@adonisjs/core/http'
import PaymentChargeAllocation from '#models/payment_charge_allocation'
import Payment from '#models/payment'
import ReservationCharge from '#models/reservation_charge'
import db from '@adonisjs/lucid/services/db'
import AuditLogger from '#services/audit_logger'
import { createPaymentChargeAllocationValidator } from '#validators/admin/hotels/create_payment_charge_allocation_validator'
import {
  prefersHtml,
  renderCatalogForm,
  renderCatalogIndex,
  respondConflictOrRedirect,
  respondSuccessOrJson,
  type CatalogField,
} from '#controllers/admin/hotels/ui_support'

export default class PaymentChargeAllocationsController {
  private toDecimal(value: unknown) {
    const parsed = parseFloat(String(value))
    return Number.isFinite(parsed) ? parsed : NaN
  }

  private async fields(): Promise<CatalogField[]> {
    const [payments, charges] = await Promise.all([
      Payment.query().orderBy('id', 'desc').limit(300),
      ReservationCharge.query().orderBy('id', 'desc').limit(300),
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
        name: 'reservationChargeId',
        label: 'Cargo de reservacion',
        type: 'select',
        required: true,
        options: charges.map((item) => ({
          value: item.id,
          label: `${item.id} - ${item.concept} (${Number(item.totalAmount).toFixed(2)})`,
        })),
      },
      { name: 'amount', label: 'Monto aplicado', type: 'number', min: 0.01, step: '0.01', required: true },
    ]
  }

  async index(ctx: HttpContext) {
    const rows = await PaymentChargeAllocation.query()
      .preload('payment')
      .preload('reservationCharge')
      .orderBy('id', 'desc')

    if (prefersHtml(ctx)) {
      return renderCatalogIndex(ctx, {
        pageKicker: 'Pagos',
        pageTitle: 'Asignaciones a Cargos',
        pageSubtitle: 'Distribuye un pago sobre cargos adicionales de reservacion.',
        createHref: '/admin/hotels/payment-charge-allocations/new',
        createLabel: 'Nueva asignacion',
        editBaseHref: '/admin/hotels/payment-charge-allocations',
        columns: [
          { key: 'id', label: 'ID' },
          { key: 'payment', label: 'Pago' },
          { key: 'charge', label: 'Cargo' },
          { key: 'amount', label: 'Monto' },
        ],
        rows: rows.map((row) => ({
          id: row.id,
          payment: row.payment.paymentNumber,
          charge: `#${row.reservationCharge.id} ${row.reservationCharge.concept}`,
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
      formTitle: 'Nueva asignacion a cargo',
      formSubtitle: 'Registra como se aplica un pago a un cargo especifico.',
      formAction: '/admin/hotels/payment-charge-allocations',
      submitLabel: 'Crear asignacion',
      backHref: '/admin/hotels/payment-charge-allocations',
      fields: await this.fields(),
      values: {
        paymentId: ctx.request.input('paymentId') || '',
        reservationChargeId: ctx.request.input('reservationChargeId') || '',
        amount: 0.01,
      },
    })
  }

  async edit(ctx: HttpContext) {
    const row = await PaymentChargeAllocation.findOrFail(ctx.params.id)

    return renderCatalogForm(ctx, {
      formMode: 'edit',
      formKicker: 'Pagos',
      formTitle: `Editar asignacion #${row.id}`,
      formSubtitle: 'Actualiza la aplicacion del pago en el cargo.',
      formAction: `/admin/hotels/payment-charge-allocations/${row.id}/update`,
      submitLabel: 'Guardar cambios',
      backHref: '/admin/hotels/payment-charge-allocations',
      fields: await this.fields(),
      values: {
        paymentId: row.paymentId,
        reservationChargeId: row.reservationChargeId,
        amount: row.amount,
      },
    })
  }

  private async validateAllocation(
    paymentId: number,
    reservationChargeId: number,
    amount: number,
    redirect: string,
    ctx: HttpContext,
    currentId?: number
  ) {
    const [payment, charge] = await Promise.all([
      Payment.find(paymentId),
      ReservationCharge.find(reservationChargeId),
    ])

    if (!payment) return respondConflictOrRedirect(ctx, 'paymentId no existe', redirect, 400)
    if (!charge) return respondConflictOrRedirect(ctx, 'reservationChargeId no existe', redirect, 400)

    const duplicateQuery = PaymentChargeAllocation.query()
      .where('paymentId', paymentId)
      .where('reservationChargeId', reservationChargeId)

    if (currentId) duplicateQuery.whereNot('id', currentId)

    const duplicate = await duplicateQuery.first()
    if (duplicate) {
      return respondConflictOrRedirect(ctx, 'La asignacion para pago/cargo ya existe', redirect, 409)
    }

    const usedAmountQuery = db.from('payment_charge_allocations').where('payment_id', paymentId)
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
    const payload = await ctx.request.validateUsing(createPaymentChargeAllocationValidator)

    const validationError = await this.validateAllocation(
      payload.paymentId,
      payload.reservationChargeId,
      payload.amount,
      '/admin/hotels/payment-charge-allocations/new',
      ctx
    )
    if (validationError) return validationError

    let row: PaymentChargeAllocation
    try {
      row = await PaymentChargeAllocation.create(payload)
    } catch (error) {
      const message = error instanceof Error ? error.message : ''
      if (message.includes('Duplicate entry')) {
        return respondConflictOrRedirect(
          ctx,
          'La asignacion para pago/cargo ya existe',
          '/admin/hotels/payment-charge-allocations/new',
          409
        )
      }

      throw error
    }

    await AuditLogger.log(
      {
        action: 'CREATE',
        entity: 'payment_charge_allocation',
        entityId: row.id,
        oldValues: null,
        newValues: row.serialize(),
        metadata: { source: 'admin.hotels.paymentChargeAllocations.store' },
      },
      ctx
    )

    return respondSuccessOrJson(
      ctx,
      'Asignacion a cargo creada',
      '/admin/hotels/payment-charge-allocations',
      row,
      true
    )
  }

  async update(ctx: HttpContext) {
    const row = await PaymentChargeAllocation.findOrFail(ctx.params.id)
    const payload = await ctx.request.validateUsing(createPaymentChargeAllocationValidator)

    const validationError = await this.validateAllocation(
      payload.paymentId,
      payload.reservationChargeId,
      payload.amount,
      `/admin/hotels/payment-charge-allocations/${row.id}/edit`,
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
          'La asignacion para pago/cargo ya existe',
          `/admin/hotels/payment-charge-allocations/${row.id}/edit`,
          409
        )
      }

      throw error
    }

    await AuditLogger.log(
      {
        action: 'UPDATE',
        entity: 'payment_charge_allocation',
        entityId: row.id,
        oldValues: previous,
        newValues: row.serialize(),
        metadata: { source: 'admin.hotels.paymentChargeAllocations.update' },
      },
      ctx
    )

    return respondSuccessOrJson(
      ctx,
      'Asignacion a cargo actualizada',
      '/admin/hotels/payment-charge-allocations',
      row
    )
  }
}
