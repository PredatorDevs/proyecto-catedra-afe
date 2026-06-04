import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import Payment from '#models/payment'
import PaymentMethod from '#models/payment_method'
import Reservation from '#models/reservation'
import CashierShift from '#models/cashier_shift'
import AuditLogger from '#services/audit_logger'
import { createPaymentValidator } from '#validators/admin/hotels/create_payment_validator'
import {
  paymentCategoryLabel,
  paymentCategoryOptions,
  paymentStatusLabel,
} from '#controllers/admin/hotels/ui_enum_labels'
import {
  prefersHtml,
  renderCatalogForm,
  renderCatalogIndex,
  respondConflictOrRedirect,
  respondSuccessOrJson,
  type CatalogField,
} from '#controllers/admin/hotels/ui_support'

function buildPaymentNumber() {
  const stamp = DateTime.now().toFormat('yyyyLLddHHmmss')
  const rand = Math.floor(Math.random() * 9000) + 1000
  return `PAY-${stamp}-${rand}`
}

type PaymentStatus = Payment['status']

const allowedStatusTransitions: Partial<Record<PaymentStatus, PaymentStatus[]>> = {
  PENDING: ['REPORTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'VOIDED'],
  REPORTED: ['UNDER_REVIEW', 'APPROVED', 'REJECTED', 'VOIDED'],
  UNDER_REVIEW: ['APPROVED', 'REJECTED', 'VOIDED'],
  APPROVED: ['REFUNDED', 'VOIDED'],
  REJECTED: [],
  VOIDED: [],
  REFUNDED: [],
}

function canTransitionStatus(from: PaymentStatus, to: PaymentStatus) {
  if (from === to) return true
  return (allowedStatusTransitions[from] || []).includes(to)
}

export default class PaymentsController {
  private async fields(): Promise<CatalogField[]> {
    const [reservations, methods] = await Promise.all([
      Reservation.query().orderBy('id', 'desc').limit(300),
      PaymentMethod.query().where('is_active', true).orderBy('name', 'asc'),
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
          label: `${item.id} - ${item.reservationNumber} (Saldo ${Number(item.balanceDue).toFixed(2)})`,
        })),
      },
      {
        name: 'paymentMethodId',
        label: 'Metodo de pago',
        type: 'select',
        required: true,
        options: methods.map((item) => ({ value: item.id, label: `${item.code} - ${item.name}` })),
      },
      { name: 'amount', label: 'Monto a pagar (auto por saldo)', type: 'number', min: 0.01, step: '0.01', readOnly: true },
      { name: 'paymentCategory', label: 'Categoria', type: 'select', options: paymentCategoryOptions },
      { name: 'currencyCode', label: 'Moneda' },
      { name: 'referenceNumber', label: 'Referencia', colSpanMd: 2 },
      { name: 'remarks', label: 'Observaciones', type: 'textarea', fullWidth: true },
    ]
  }

  async index(ctx: HttpContext) {
    const rows = await Payment.query()
      .preload('reservation')
      .preload('paymentMethod')
      .preload('cashierShift')
      .orderBy('id', 'desc')

    if (prefersHtml(ctx)) {
      return renderCatalogIndex(ctx, {
        pageKicker: 'Pagos',
        pageTitle: 'Pagos de Reservacion',
        pageSubtitle: 'Registro manual de pagos, revisiones y aprobaciones operativas.',
        createHref: '/admin/hotels/payments/new',
        createLabel: 'Nuevo pago',
        editBaseHref: '/admin/hotels/payments',
        columns: [
          { key: 'paymentNumber', label: 'Numero', badge: true },
          { key: 'reservation', label: 'Reservacion' },
          { key: 'method', label: 'Metodo' },
          { key: 'status', label: 'Estado', badge: true },
          { key: 'category', label: 'Categoria' },
          { key: 'amount', label: 'Monto' },
        ],
        rows: rows.map((row) => ({
          id: row.id,
          paymentNumber: row.paymentNumber,
          reservation: row.reservation.reservationNumber,
          method: row.paymentMethod.name,
          status: paymentStatusLabel(row.status),
          category: paymentCategoryLabel(row.paymentCategory),
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
      formTitle: 'Nuevo pago manual',
      formSubtitle: 'Selecciona la reservacion y el sistema completa numero, estado, monto por saldo y fechas automaticamente.',
      formAction: '/admin/hotels/payments',
      submitLabel: 'Crear pago',
      backHref: '/admin/hotels/payments',
      fields: await this.fields(),
      values: {
        paymentCategory: 'LODGING',
        currencyCode: 'USD',
        amount: 0,
      },
    })
  }

  async edit(ctx: HttpContext) {
    const row = await Payment.findOrFail(ctx.params.id)

    return renderCatalogForm(ctx, {
      formMode: 'edit',
      formKicker: 'Pagos',
      formTitle: `Editar pago #${row.id}`,
      formSubtitle: 'Actualiza estado de validacion y datos del comprobante manual.',
      formAction: `/admin/hotels/payments/${row.id}/update`,
      submitLabel: 'Guardar cambios',
      backHref: '/admin/hotels/payments',
      fields: await this.fields(),
      values: {
        reservationId: row.reservationId,
        paymentMethodId: row.paymentMethodId,
        amount: row.amount,
        paymentCategory: row.paymentCategory,
        currencyCode: row.currencyCode,
        referenceNumber: row.referenceNumber,
        remarks: row.remarks,
      },
    })
  }

  private isSameMoney(left: number, right: number) {
    return Math.abs(left - right) < 0.005
  }

  private async applyReservationAmountImpact(
    reservationId: number,
    previousStatus: PaymentStatus,
    nextStatus: PaymentStatus,
    previousAmount: number,
    nextAmount: number
  ) {
    const wasApproved = previousStatus === 'APPROVED'
    const isApproved = nextStatus === 'APPROVED'

    let delta = 0
    if (!wasApproved && isApproved) delta = nextAmount
    if (wasApproved && !isApproved) delta = -previousAmount
    if (wasApproved && isApproved) delta = nextAmount - previousAmount

    if (delta === 0) return

    const reservation = await Reservation.find(reservationId)
    if (!reservation) return

    reservation.amountPaid = Math.max(0, Number(reservation.amountPaid) + delta)
    reservation.balanceDue = Math.max(0, Number(reservation.totalAmount) - Number(reservation.amountPaid))
    await reservation.save()
  }

  private async validateBusinessRules(
    payload: Awaited<ReturnType<typeof createPaymentValidator['validate']>>,
    current?: Payment
  ) {
    const reservation = await Reservation.find(payload.reservationId)
    if (!reservation) return { error: 'reservationId no existe' }

    const method = await PaymentMethod.find(payload.paymentMethodId)
    if (!method) return { error: 'paymentMethodId no existe' }

    if (method.requiresReference && !payload.referenceNumber?.trim()) {
      return { error: 'El metodo seleccionado requiere referencia de pago' }
    }

    let resolvedCashierShiftId = payload.cashierShiftId ?? null

    if (method.isCash && !resolvedCashierShiftId) {
      const openShift = await CashierShift.query().where('status', 'OPEN').orderBy('id', 'desc').first()
      resolvedCashierShiftId = openShift?.id ?? null
    }

    if (resolvedCashierShiftId) {
      const shift = await CashierShift.find(resolvedCashierShiftId)
      if (!shift) return { error: 'cashierShiftId no existe' }
      if (shift.status !== 'OPEN') {
        return { error: 'El turno de caja seleccionado no esta abierto' }
      }
    }

    if (payload.parentPaymentId) {
      const parent = await Payment.find(payload.parentPaymentId)
      if (!parent) return { error: 'parentPaymentId no existe' }
      if (current && parent.id === current.id) {
        return { error: 'Un pago no puede referenciarse a si mismo' }
      }
    }

    if (current) {
      const currentStatus = current.status as PaymentStatus
      const nextStatus = (payload.status as PaymentStatus | undefined) ?? currentStatus
      if (!canTransitionStatus(currentStatus, nextStatus)) {
        return { error: `Transicion de estado invalida: ${currentStatus} -> ${nextStatus}` }
      }
    }

    return { reservation, method, resolvedCashierShiftId, error: null as string | null }
  }

  async store(ctx: HttpContext) {
    const payload = await ctx.request.validateUsing(createPaymentValidator)

    const validation = await this.validateBusinessRules(payload)
    if (validation.error) {
      return respondConflictOrRedirect(ctx, validation.error, '/admin/hotels/payments/new', 400)
    }

    const now = DateTime.now()
    const status: PaymentStatus = 'APPROVED'
    const balanceDue = Number(validation.reservation!.balanceDue)

    if (balanceDue <= 0) {
      return respondConflictOrRedirect(
        ctx,
        'La reservacion no tiene saldo pendiente para registrar pago',
        '/admin/hotels/payments/new',
        400
      )
    }

    if (typeof payload.amount === 'number' && !this.isSameMoney(payload.amount, balanceDue)) {
      return respondConflictOrRedirect(
        ctx,
        'El monto del pago debe ser exactamente igual al saldo actual de la reservacion',
        '/admin/hotels/payments/new',
        400
      )
    }

    const row = await Payment.create({
      paymentNumber: buildPaymentNumber(),
      reservationId: payload.reservationId,
      paymentMethodId: payload.paymentMethodId,
      cashierShiftId: validation.resolvedCashierShiftId ?? null,
      parentPaymentId: null,
      paymentCategory: (payload.paymentCategory as Payment['paymentCategory'] | undefined) ?? 'LODGING',
      status,
      currencyCode: (payload.currencyCode ?? 'USD').toUpperCase(),
      amount: balanceDue,
      referenceNumber: payload.referenceNumber ?? null,
      receiptNumber: null,
      reportedAt: now,
      paidAt: now,
      approvedAt: now,
      rejectedAt: null,
      voidedAt: null,
      remarks: payload.remarks ?? null,
      recordedByUserId: payload.recordedByUserId ?? ctx.auth.user?.id ?? null,
      approvedByUserId: payload.approvedByUserId ?? ctx.auth.user?.id ?? null,
      voidedByUserId: null,
    })

    await this.applyReservationAmountImpact(row.reservationId, 'PENDING', row.status, 0, Number(row.amount))

    await AuditLogger.log(
      {
        action: 'CREATE',
        entity: 'payment',
        entityId: row.id,
        oldValues: null,
        newValues: row.serialize(),
        metadata: { source: 'admin.hotels.payments.store' },
      },
      ctx
    )

    return respondSuccessOrJson(ctx, 'Pago creado', '/admin/hotels/payments', row, true)
  }

  async update(ctx: HttpContext) {
    const row = await Payment.findOrFail(ctx.params.id)
    const payload = await ctx.request.validateUsing(createPaymentValidator)

    const validation = await this.validateBusinessRules(payload, row)
    if (validation.error) {
      return respondConflictOrRedirect(ctx, validation.error, `/admin/hotels/payments/${row.id}/edit`, 400)
    }

    const previous = row.serialize()
    const previousStatus = row.status as PaymentStatus
    const previousAmount = Number(row.amount)

    const nextStatus = previousStatus === 'VOIDED' ? 'VOIDED' : previousStatus
    row.paymentNumber = row.paymentNumber
    row.reservationId = payload.reservationId
    row.paymentMethodId = payload.paymentMethodId
    row.cashierShiftId = validation.resolvedCashierShiftId ?? null
    row.parentPaymentId = null
    row.paymentCategory = (payload.paymentCategory as Payment['paymentCategory'] | undefined) ?? row.paymentCategory
    row.status = nextStatus
    row.currencyCode = (payload.currencyCode ?? row.currencyCode).toUpperCase()
    if (typeof payload.amount === 'number' && !this.isSameMoney(payload.amount, Number(row.amount))) {
      return respondConflictOrRedirect(
        ctx,
        'El monto del pago no puede modificarse manualmente en esta vista',
        `/admin/hotels/payments/${row.id}/edit`,
        400
      )
    }

    row.amount = row.amount
    row.referenceNumber = payload.referenceNumber ?? row.referenceNumber
    row.receiptNumber = null
    row.reportedAt = row.reportedAt ?? DateTime.now()
    row.paidAt = row.paidAt ?? DateTime.now()
    row.approvedAt = row.approvedAt ?? DateTime.now()
    row.approvedByUserId = row.approvedByUserId ?? payload.approvedByUserId ?? ctx.auth.user?.id ?? null

    row.remarks = payload.remarks ?? row.remarks
    row.recordedByUserId = payload.recordedByUserId ?? row.recordedByUserId

    await row.save()

    await this.applyReservationAmountImpact(
      row.reservationId,
      previousStatus,
      row.status as PaymentStatus,
      previousAmount,
      Number(row.amount)
    )

    await AuditLogger.log(
      {
        action: 'UPDATE',
        entity: 'payment',
        entityId: row.id,
        oldValues: previous,
        newValues: row.serialize(),
        metadata: { source: 'admin.hotels.payments.update' },
      },
      ctx
    )

    return respondSuccessOrJson(ctx, 'Pago actualizado', '/admin/hotels/payments', row)
  }
}
