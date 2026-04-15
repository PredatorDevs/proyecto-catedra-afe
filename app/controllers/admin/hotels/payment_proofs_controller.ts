import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import PaymentProof from '#models/payment_proof'
import Payment from '#models/payment'
import AuditLogger from '#services/audit_logger'
import { createPaymentProofValidator } from '#validators/admin/hotels/create_payment_proof_validator'
import {
  paymentProofValidationStatusLabel,
  paymentProofValidationStatusOptions,
} from '#controllers/admin/hotels/ui_enum_labels'
import {
  prefersHtml,
  renderCatalogForm,
  renderCatalogIndex,
  respondConflictOrRedirect,
  respondSuccessOrJson,
  type CatalogField,
} from '#controllers/admin/hotels/ui_support'

export default class PaymentProofsController {
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
      { name: 'filePath', label: 'Ruta archivo', required: true, colSpanMd: 2 },
      { name: 'originalName', label: 'Nombre original', colSpanMd: 2 },
      { name: 'mimeType', label: 'Mime type' },
      { name: 'fileSizeBytes', label: 'Tamano bytes', type: 'number', min: 1, step: '1' },
      {
        name: 'validationStatus',
        label: 'Estado validacion',
        type: 'select',
        options: paymentProofValidationStatusOptions,
      },
      { name: 'validatedAt', label: 'Validado en', type: 'date' },
      { name: 'notes', label: 'Notas', type: 'textarea', fullWidth: true },
    ]
  }

  async index(ctx: HttpContext) {
    const rows = await PaymentProof.query().preload('payment').orderBy('id', 'desc')

    if (prefersHtml(ctx)) {
      return renderCatalogIndex(ctx, {
        pageKicker: 'Pagos',
        pageTitle: 'Comprobantes de Pago',
        pageSubtitle: 'Gestiona respaldos y validacion manual de pagos reportados.',
        createHref: '/admin/hotels/payment-proofs/new',
        createLabel: 'Nuevo comprobante',
        editBaseHref: '/admin/hotels/payment-proofs',
        columns: [
          { key: 'id', label: 'ID' },
          { key: 'payment', label: 'Pago' },
          { key: 'validationStatus', label: 'Estado', badge: true },
          { key: 'mimeType', label: 'Mime' },
          { key: 'fileSizeBytes', label: 'Bytes' },
        ],
        rows: rows.map((row) => ({
          id: row.id,
          payment: row.payment.paymentNumber,
          validationStatus: paymentProofValidationStatusLabel(row.validationStatus),
          mimeType: row.mimeType ?? '-',
          fileSizeBytes: row.fileSizeBytes ?? '-',
        })),
      })
    }

    return ctx.response.ok({ data: rows })
  }

  async create(ctx: HttpContext) {
    return renderCatalogForm(ctx, {
      formMode: 'create',
      formKicker: 'Pagos',
      formTitle: 'Nuevo comprobante de pago',
      formSubtitle: 'Registra evidencia documental del pago manual reportado.',
      formAction: '/admin/hotels/payment-proofs',
      submitLabel: 'Crear comprobante',
      backHref: '/admin/hotels/payment-proofs',
      fields: await this.fields(),
      values: {
        paymentId: ctx.request.input('paymentId') || '',
        validationStatus: 'PENDING',
      },
    })
  }

  async edit(ctx: HttpContext) {
    const row = await PaymentProof.findOrFail(ctx.params.id)

    return renderCatalogForm(ctx, {
      formMode: 'edit',
      formKicker: 'Pagos',
      formTitle: `Editar comprobante #${row.id}`,
      formSubtitle: 'Actualiza metadatos y estado de validacion del comprobante.',
      formAction: `/admin/hotels/payment-proofs/${row.id}/update`,
      submitLabel: 'Guardar cambios',
      backHref: '/admin/hotels/payment-proofs',
      fields: await this.fields(),
      values: {
        paymentId: row.paymentId,
        filePath: row.filePath,
        originalName: row.originalName,
        mimeType: row.mimeType,
        fileSizeBytes: row.fileSizeBytes,
        validationStatus: row.validationStatus,
        validatedAt: row.validatedAt?.toISODate(),
        notes: row.notes,
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
    const payload = await ctx.request.validateUsing(createPaymentProofValidator)

    const missingPayment = await this.assertPaymentExists(payload.paymentId, '/admin/hotels/payment-proofs/new', ctx)
    if (missingPayment) return missingPayment

    const status = (payload.validationStatus as PaymentProof['validationStatus'] | undefined) ?? 'PENDING'
    const row = await PaymentProof.create({
      paymentId: payload.paymentId,
      filePath: payload.filePath,
      originalName: payload.originalName ?? null,
      mimeType: payload.mimeType ?? null,
      fileSizeBytes: payload.fileSizeBytes ?? null,
      validationStatus: status,
      uploadedByUserId: payload.uploadedByUserId ?? ctx.auth.user?.id ?? null,
      validatedByUserId: status === 'APPROVED' ? payload.validatedByUserId ?? ctx.auth.user?.id ?? null : null,
      validatedAt: status === 'APPROVED' ? payload.validatedAt ? DateTime.fromJSDate(payload.validatedAt) : DateTime.now() : null,
      notes: payload.notes ?? null,
    })

    await AuditLogger.log(
      {
        action: 'CREATE',
        entity: 'payment_proof',
        entityId: row.id,
        oldValues: null,
        newValues: row.serialize(),
        metadata: { source: 'admin.hotels.paymentProofs.store' },
      },
      ctx
    )

    return respondSuccessOrJson(ctx, 'Comprobante creado', '/admin/hotels/payment-proofs', row, true)
  }

  async update(ctx: HttpContext) {
    const row = await PaymentProof.findOrFail(ctx.params.id)
    const payload = await ctx.request.validateUsing(createPaymentProofValidator)

    const missingPayment = await this.assertPaymentExists(payload.paymentId, `/admin/hotels/payment-proofs/${row.id}/edit`, ctx)
    if (missingPayment) return missingPayment

    const previous = row.serialize()
    const status = (payload.validationStatus as PaymentProof['validationStatus'] | undefined) ?? row.validationStatus

    row.paymentId = payload.paymentId
    row.filePath = payload.filePath
    row.originalName = payload.originalName ?? row.originalName
    row.mimeType = payload.mimeType ?? row.mimeType
    row.fileSizeBytes = payload.fileSizeBytes ?? row.fileSizeBytes
    row.validationStatus = status
    row.notes = payload.notes ?? row.notes

    if (status === 'APPROVED') {
      row.validatedByUserId = payload.validatedByUserId ?? ctx.auth.user?.id ?? row.validatedByUserId
      row.validatedAt = payload.validatedAt ? DateTime.fromJSDate(payload.validatedAt) : row.validatedAt ?? DateTime.now()
    }

    await row.save()

    await AuditLogger.log(
      {
        action: 'UPDATE',
        entity: 'payment_proof',
        entityId: row.id,
        oldValues: previous,
        newValues: row.serialize(),
        metadata: { source: 'admin.hotels.paymentProofs.update' },
      },
      ctx
    )

    return respondSuccessOrJson(ctx, 'Comprobante actualizado', '/admin/hotels/payment-proofs', row)
  }
}
