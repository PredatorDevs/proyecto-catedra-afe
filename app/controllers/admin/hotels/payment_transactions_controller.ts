import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import PaymentTransaction from '#models/payment_transaction'
import Payment from '#models/payment'
import AuditLogger from '#services/audit_logger'
import { createPaymentTransactionValidator } from '#validators/admin/hotels/create_payment_transaction_validator'
import {
  prefersHtml,
  renderCatalogForm,
  renderCatalogIndex,
  respondConflictOrRedirect,
  respondSuccessOrJson,
  type CatalogField,
} from '#controllers/admin/hotels/ui_support'

export default class PaymentTransactionsController {
  private async fields(): Promise<CatalogField[]> {
    const payments = await Payment.query().orderBy('id', 'desc').limit(300)

    return [
      {
        name: 'paymentId',
        label: 'Pago',
        type: 'select',
        required: true,
        options: payments.map((payment) => ({
          value: payment.id,
          label: `${payment.id} - ${payment.paymentNumber}`,
        })),
      },
      { name: 'provider', label: 'Proveedor', required: true },
      { name: 'externalTransactionId', label: 'Transaccion externa', colSpanMd: 2 },
      { name: 'authorizationCode', label: 'Codigo autorizacion', colSpanMd: 2 },
      { name: 'transactionStatus', label: 'Estado transaccion', required: true },
      { name: 'processedAt', label: 'Procesado en', type: 'date' },
      { name: 'requestPayload', label: 'Request payload (JSON)', type: 'textarea', fullWidth: true },
      { name: 'responsePayload', label: 'Response payload (JSON)', type: 'textarea', fullWidth: true },
      { name: 'rawResponse', label: 'Raw response (JSON)', type: 'textarea', fullWidth: true },
    ]
  }

  private parseJsonOrNull(value: unknown) {
    if (value === null || value === undefined || value === '') return null
    if (typeof value === 'object') return value as Record<string, unknown>
    if (typeof value !== 'string') return null

    try {
      const parsed = JSON.parse(value)
      return typeof parsed === 'object' && parsed !== null ? parsed : null
    } catch {
      return null
    }
  }

  async index(ctx: HttpContext) {
    const rows = await PaymentTransaction.query().preload('payment').orderBy('id', 'desc')

    if (prefersHtml(ctx)) {
      return renderCatalogIndex(ctx, {
        pageKicker: 'Pagos',
        pageTitle: 'Transacciones de Pago',
        pageSubtitle: 'Registro de referencia operativa de transacciones online o bancarias.',
        createHref: '/admin/hotels/payment-transactions/new',
        createLabel: 'Nueva transaccion',
        editBaseHref: '/admin/hotels/payment-transactions',
        columns: [
          { key: 'id', label: 'ID' },
          { key: 'payment', label: 'Pago' },
          { key: 'provider', label: 'Proveedor', badge: true },
          { key: 'transactionStatus', label: 'Estado', badge: true },
          { key: 'externalTransactionId', label: 'Externa' },
        ],
        rows: rows.map((row) => ({
          id: row.id,
          payment: row.payment.paymentNumber,
          provider: row.provider,
          transactionStatus: row.transactionStatus,
          externalTransactionId: row.externalTransactionId ?? '-',
        })),
      })
    }

    return ctx.response.ok({ data: rows })
  }

  async create(ctx: HttpContext) {
    return renderCatalogForm(ctx, {
      formMode: 'create',
      formKicker: 'Pagos',
      formTitle: 'Nueva transaccion de pago',
      formSubtitle: 'Registra metadata de transaccion asociada a un pago.',
      formAction: '/admin/hotels/payment-transactions',
      submitLabel: 'Crear transaccion',
      backHref: '/admin/hotels/payment-transactions',
      fields: await this.fields(),
      values: { paymentId: ctx.request.input('paymentId') || '' },
    })
  }

  async edit(ctx: HttpContext) {
    const row = await PaymentTransaction.findOrFail(ctx.params.id)

    return renderCatalogForm(ctx, {
      formMode: 'edit',
      formKicker: 'Pagos',
      formTitle: `Editar transaccion #${row.id}`,
      formSubtitle: 'Actualiza proveedor, estado y payloads de soporte.',
      formAction: `/admin/hotels/payment-transactions/${row.id}/update`,
      submitLabel: 'Guardar cambios',
      backHref: '/admin/hotels/payment-transactions',
      fields: await this.fields(),
      values: {
        paymentId: row.paymentId,
        provider: row.provider,
        externalTransactionId: row.externalTransactionId,
        authorizationCode: row.authorizationCode,
        transactionStatus: row.transactionStatus,
        processedAt: row.processedAt?.toISODate(),
        requestPayload: row.requestPayload ? JSON.stringify(row.requestPayload, null, 2) : null,
        responsePayload: row.responsePayload ? JSON.stringify(row.responsePayload, null, 2) : null,
        rawResponse: row.rawResponse ? JSON.stringify(row.rawResponse, null, 2) : null,
      },
    })
  }

  private async assertPaymentExists(paymentId: number, redirectTo: string, ctx: HttpContext) {
    const payment = await Payment.find(paymentId)
    if (!payment) {
      return respondConflictOrRedirect(ctx, 'paymentId no existe', redirectTo, 400)
    }

    return null
  }

  async store(ctx: HttpContext) {
    const payload = await ctx.request.validateUsing(createPaymentTransactionValidator)

    const missingPayment = await this.assertPaymentExists(
      payload.paymentId,
      '/admin/hotels/payment-transactions/new',
      ctx
    )
    if (missingPayment) return missingPayment

    if (payload.externalTransactionId) {
      const existing = await PaymentTransaction.query()
        .where('external_transaction_id', payload.externalTransactionId)
        .first()

      if (existing) {
        return respondConflictOrRedirect(
          ctx,
          'externalTransactionId ya existe',
          '/admin/hotels/payment-transactions/new',
          409
        )
      }
    }

    const row = await PaymentTransaction.create({
      paymentId: payload.paymentId,
      provider: payload.provider,
      externalTransactionId: payload.externalTransactionId ?? null,
      authorizationCode: payload.authorizationCode ?? null,
      transactionStatus: payload.transactionStatus,
      requestPayload: this.parseJsonOrNull(ctx.request.input('requestPayload')),
      responsePayload: this.parseJsonOrNull(ctx.request.input('responsePayload')),
      rawResponse: this.parseJsonOrNull(ctx.request.input('rawResponse')),
      processedAt: payload.processedAt ? DateTime.fromJSDate(payload.processedAt) : null,
    })

    await AuditLogger.log(
      {
        action: 'CREATE',
        entity: 'payment_transaction',
        entityId: row.id,
        oldValues: null,
        newValues: row.serialize(),
        metadata: { source: 'admin.hotels.paymentTransactions.store' },
      },
      ctx
    )

    return respondSuccessOrJson(ctx, 'Transaccion creada', '/admin/hotels/payment-transactions', row, true)
  }

  async update(ctx: HttpContext) {
    const row = await PaymentTransaction.findOrFail(ctx.params.id)
    const payload = await ctx.request.validateUsing(createPaymentTransactionValidator)

    const missingPayment = await this.assertPaymentExists(
      payload.paymentId,
      `/admin/hotels/payment-transactions/${row.id}/edit`,
      ctx
    )
    if (missingPayment) return missingPayment

    if (payload.externalTransactionId) {
      const existing = await PaymentTransaction.query()
        .where('external_transaction_id', payload.externalTransactionId)
        .whereNot('id', row.id)
        .first()

      if (existing) {
        return respondConflictOrRedirect(
          ctx,
          'externalTransactionId ya existe',
          `/admin/hotels/payment-transactions/${row.id}/edit`,
          409
        )
      }
    }

    const previous = row.serialize()

    row.paymentId = payload.paymentId
    row.provider = payload.provider
    row.externalTransactionId = payload.externalTransactionId ?? null
    row.authorizationCode = payload.authorizationCode ?? null
    row.transactionStatus = payload.transactionStatus
    row.requestPayload = this.parseJsonOrNull(ctx.request.input('requestPayload'))
    row.responsePayload = this.parseJsonOrNull(ctx.request.input('responsePayload'))
    row.rawResponse = this.parseJsonOrNull(ctx.request.input('rawResponse'))
    row.processedAt = payload.processedAt ? DateTime.fromJSDate(payload.processedAt) : row.processedAt

    await row.save()

    await AuditLogger.log(
      {
        action: 'UPDATE',
        entity: 'payment_transaction',
        entityId: row.id,
        oldValues: previous,
        newValues: row.serialize(),
        metadata: { source: 'admin.hotels.paymentTransactions.update' },
      },
      ctx
    )

    return respondSuccessOrJson(ctx, 'Transaccion actualizada', '/admin/hotels/payment-transactions', row)
  }
}
