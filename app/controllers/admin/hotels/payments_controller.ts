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
  paymentStatusOptions,
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
    const [reservations, methods, shifts, payments] = await Promise.all([
      Reservation.query().orderBy('id', 'desc').limit(300),
      PaymentMethod.query().where('is_active', true).orderBy('name', 'asc'),
      CashierShift.query().orderBy('id', 'desc').limit(100),
      Payment.query().orderBy('id', 'desc').limit(300),
    ])

    return [
      {
        name: 'reservationId',
        label: 'Reservacion',
        type: 'select',
        required: true,
        colSpanMd: 2,
        options: reservations.map((item) => ({ value: item.id, label: `${item.id} - ${item.reservationNumber}` })),
      },
      {
        name: 'paymentMethodId',
        label: 'Metodo de pago',
        type: 'select',
        required: true,
        options: methods.map((item) => ({ value: item.id, label: `${item.code} - ${item.name}` })),
      },
      {
        name: 'cashierShiftId',
        label: 'Turno caja (si aplica)',
        type: 'select',
        options: shifts.map((item) => ({
          value: item.id,
          label: `${item.shiftNumber} (${item.status})`,
        })),
      },
      {
        name: 'parentPaymentId',
        label: 'Pago padre (reversa/reembolso)',
        type: 'select',
        options: payments.map((item) => ({ value: item.id, label: `${item.id} - ${item.paymentNumber}` })),
      },
      { name: 'paymentNumber', label: 'Numero de pago', colSpanMd: 2 },
      { name: 'paymentCategory', label: 'Categoria', type: 'select', options: paymentCategoryOptions },
      { name: 'status', label: 'Estado', type: 'select', options: paymentStatusOptions },
      { name: 'currencyCode', label: 'Moneda' },
      { name: 'amount', label: 'Monto', type: 'number', min: 0.01, step: '0.01', required: true },
      { name: 'referenceNumber', label: 'Referencia', colSpanMd: 2 },
      { name: 'receiptNumber', label: 'Recibo', colSpanMd: 2 },
      { name: 'reportedAt', label: 'Reportado en', type: 'date' },
      { name: 'paidAt', label: 'Pagado en', type: 'date' },
      { name: 'approvedAt', label: 'Aprobado en', type: 'date' },
      { name: 'rejectedAt', label: 'Rechazado en', type: 'date' },
      { name: 'voidedAt', label: 'Anulado en', type: 'date' },
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
      formSubtitle: 'Registra pago reportado por cliente sin pasarela integrada.',
      formAction: '/admin/hotels/payments',
      submitLabel: 'Crear pago',
      backHref: '/admin/hotels/payments',
      fields: await this.fields(),
      values: {
        paymentCategory: 'LODGING',
        status: 'PENDING',
        currencyCode: 'USD',
        amount: 0.01,
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
        paymentNumber: row.paymentNumber,
        reservationId: row.reservationId,
        paymentMethodId: row.paymentMethodId,
        cashierShiftId: row.cashierShiftId,
        parentPaymentId: row.parentPaymentId,
        paymentCategory: row.paymentCategory,
        status: row.status,
        currencyCode: row.currencyCode,
        amount: row.amount,
        referenceNumber: row.referenceNumber,
        receiptNumber: row.receiptNumber,
        reportedAt: row.reportedAt?.toISODate(),
        paidAt: row.paidAt?.toISODate(),
        approvedAt: row.approvedAt?.toISODate(),
        rejectedAt: row.rejectedAt?.toISODate(),
        voidedAt: row.voidedAt?.toISODate(),
        remarks: row.remarks,
      },
    })
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

    if (method.isCash && !payload.cashierShiftId) {
      return { error: 'Los pagos en efectivo requieren turno de caja' }
    }

    if (payload.cashierShiftId) {
      const shift = await CashierShift.find(payload.cashierShiftId)
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

    return { reservation, method, error: null as string | null }
  }

  async store(ctx: HttpContext) {
    const payload = await ctx.request.validateUsing(createPaymentValidator)

    const validation = await this.validateBusinessRules(payload)
    if (validation.error) {
      return respondConflictOrRedirect(ctx, validation.error, '/admin/hotels/payments/new', 400)
    }

    const now = DateTime.now()
    const status = (payload.status as PaymentStatus | undefined) ?? 'PENDING'
    const row = await Payment.create({
      paymentNumber: payload.paymentNumber?.trim() || buildPaymentNumber(),
      reservationId: payload.reservationId,
      paymentMethodId: payload.paymentMethodId,
      cashierShiftId: payload.cashierShiftId ?? null,
      parentPaymentId: payload.parentPaymentId ?? null,
      paymentCategory: (payload.paymentCategory as Payment['paymentCategory'] | undefined) ?? 'LODGING',
      status,
      currencyCode: (payload.currencyCode ?? 'USD').toUpperCase(),
      amount: payload.amount,
      referenceNumber: payload.referenceNumber ?? null,
      receiptNumber: payload.receiptNumber ?? null,
      reportedAt: payload.reportedAt ? DateTime.fromJSDate(payload.reportedAt) : null,
      paidAt: payload.paidAt ? DateTime.fromJSDate(payload.paidAt) : null,
      approvedAt:
        status === 'APPROVED'
          ? payload.approvedAt
            ? DateTime.fromJSDate(payload.approvedAt)
            : now
          : null,
      rejectedAt: status === 'REJECTED' ? (payload.rejectedAt ? DateTime.fromJSDate(payload.rejectedAt) : now) : null,
      voidedAt: status === 'VOIDED' ? (payload.voidedAt ? DateTime.fromJSDate(payload.voidedAt) : now) : null,
      remarks: payload.remarks ?? null,
      recordedByUserId: payload.recordedByUserId ?? ctx.auth.user?.id ?? null,
      approvedByUserId: status === 'APPROVED' ? payload.approvedByUserId ?? ctx.auth.user?.id ?? null : null,
      voidedByUserId: status === 'VOIDED' ? payload.voidedByUserId ?? ctx.auth.user?.id ?? null : null,
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

    const nextStatus = (payload.status as PaymentStatus | undefined) ?? previousStatus
    row.paymentNumber = payload.paymentNumber?.trim() || row.paymentNumber
    row.reservationId = payload.reservationId
    row.paymentMethodId = payload.paymentMethodId
    row.cashierShiftId = payload.cashierShiftId ?? null
    row.parentPaymentId = payload.parentPaymentId ?? null
    row.paymentCategory = (payload.paymentCategory as Payment['paymentCategory'] | undefined) ?? row.paymentCategory
    row.status = nextStatus
    row.currencyCode = (payload.currencyCode ?? row.currencyCode).toUpperCase()
    row.amount = payload.amount
    row.referenceNumber = payload.referenceNumber ?? row.referenceNumber
    row.receiptNumber = payload.receiptNumber ?? row.receiptNumber
    row.reportedAt = payload.reportedAt ? DateTime.fromJSDate(payload.reportedAt) : row.reportedAt
    row.paidAt = payload.paidAt ? DateTime.fromJSDate(payload.paidAt) : row.paidAt

    if (nextStatus === 'APPROVED' && !row.approvedAt) {
      row.approvedAt = payload.approvedAt ? DateTime.fromJSDate(payload.approvedAt) : DateTime.now()
      row.approvedByUserId = payload.approvedByUserId ?? ctx.auth.user?.id ?? row.approvedByUserId
    }

    if (nextStatus === 'REJECTED' && !row.rejectedAt) {
      row.rejectedAt = payload.rejectedAt ? DateTime.fromJSDate(payload.rejectedAt) : DateTime.now()
    }

    if (nextStatus === 'VOIDED' && !row.voidedAt) {
      row.voidedAt = payload.voidedAt ? DateTime.fromJSDate(payload.voidedAt) : DateTime.now()
      row.voidedByUserId = payload.voidedByUserId ?? ctx.auth.user?.id ?? row.voidedByUserId
    }

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
