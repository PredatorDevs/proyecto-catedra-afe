import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import FiscalDocument from '#models/fiscal_document'
import Reservation from '#models/reservation'
import Customer from '#models/customer'
import AuditLogger from '#services/audit_logger'
import { createFiscalDocumentValidator } from '#validators/admin/hotels/create_fiscal_document_validator'
import {
  fiscalDocumentStatusLabel,
  fiscalDocumentStatusOptions,
  fiscalDocumentTypeLabel,
  fiscalDocumentTypeOptions,
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

export default class FiscalDocumentsController {
  private async fields(): Promise<CatalogField[]> {
    const [reservations, customers] = await Promise.all([
      Reservation.query().orderBy('id', 'desc').limit(300),
      Customer.query().orderBy('full_name', 'asc').limit(300),
    ])

    return [
      {
        name: 'reservationId',
        label: 'Reservacion',
        type: 'select',
        required: true,
        options: reservations.map((item) => ({ value: item.id, label: `${item.id} - ${item.reservationNumber}` })),
      },
      {
        name: 'customerId',
        label: 'Cliente',
        type: 'select',
        required: true,
        options: customers.map((item) => ({ value: item.id, label: `${item.id} - ${item.fullName}` })),
      },
      { name: 'documentType', label: 'Tipo documento', type: 'select', options: fiscalDocumentTypeOptions },
      { name: 'status', label: 'Estado', type: 'select', options: fiscalDocumentStatusOptions },
      { name: 'documentNumber', label: 'Numero documento', required: true, colSpanMd: 2 },
      { name: 'currencyCode', label: 'Moneda' },
      { name: 'customerNameSnapshot', label: 'Nombre cliente (snapshot)', required: true, colSpanMd: 2 },
      { name: 'customerDocumentSnapshot', label: 'Documento cliente', colSpanMd: 2 },
      { name: 'taxNameSnapshot', label: 'Nombre fiscal', colSpanMd: 2 },
      { name: 'taxNitSnapshot', label: 'NIT', colSpanMd: 1 },
      { name: 'taxNrcSnapshot', label: 'NRC', colSpanMd: 1 },
      { name: 'taxAddressSnapshot', label: 'Direccion fiscal', type: 'textarea', colSpanMd: 2 },
      { name: 'subtotal', label: 'Subtotal', type: 'number', min: 0, step: '0.01' },
      { name: 'ivaTotal', label: 'IVA', type: 'number', min: 0, step: '0.01' },
      { name: 'tourismTaxTotal', label: 'Impuesto turismo', type: 'number', min: 0, step: '0.01' },
      { name: 'totalAmount', label: 'Total', type: 'number', min: 0, step: '0.01' },
      { name: 'issuedAt', label: 'Emitido en', type: 'date' },
      { name: 'voidedAt', label: 'Anulado en', type: 'date' },
      { name: 'voidReason', label: 'Motivo anulacion', type: 'textarea', fullWidth: true },
    ]
  }

  async index(ctx: HttpContext) {
    const rows = await FiscalDocument.query().preload('reservation').preload('customer').orderBy('id', 'desc')

    if (prefersHtml(ctx)) {
      return renderCatalogIndex(ctx, {
        pageKicker: 'Fiscal',
        pageTitle: 'Documentos Fiscales',
        pageSubtitle: 'Emision y control de comprobantes asociados a reservaciones.',
        createHref: '/admin/hotels/fiscal-documents/new',
        createLabel: 'Nuevo documento',
        editBaseHref: '/admin/hotels/fiscal-documents',
        columns: [
          { key: 'documentNumber', label: 'Documento', badge: true },
          { key: 'documentType', label: 'Tipo', badge: true },
          { key: 'status', label: 'Estado', badge: true },
          { key: 'reservation', label: 'Reservacion' },
          { key: 'customer', label: 'Cliente' },
          { key: 'totalAmount', label: 'Total' },
        ],
        rows: rows.map((row) => ({
          id: row.id,
          documentNumber: row.documentNumber,
          documentType: fiscalDocumentTypeLabel(row.documentType),
          status: fiscalDocumentStatusLabel(row.status),
          reservation: row.reservation.reservationNumber,
          customer: row.customer.fullName,
          totalAmount: Number(row.totalAmount).toFixed(2),
        })),
      })
    }

    return ctx.response.ok({ data: rows })
  }

  async create(ctx: HttpContext) {
    return renderCatalogForm(ctx, {
      formMode: 'create',
      formKicker: 'Fiscal',
      formTitle: 'Nuevo documento fiscal',
      formSubtitle: 'Genera documento tributario a partir de snapshot de cliente y montos.',
      formAction: '/admin/hotels/fiscal-documents',
      submitLabel: 'Crear documento',
      backHref: '/admin/hotels/fiscal-documents',
      fields: await this.fields(),
      values: {
        status: 'PENDING',
        documentType: 'CONSUMER_FINAL',
        currencyCode: 'USD',
        subtotal: 0,
        ivaTotal: 0,
        tourismTaxTotal: 0,
        totalAmount: 0,
      },
    })
  }

  async edit(ctx: HttpContext) {
    const row = await FiscalDocument.findOrFail(ctx.params.id)

    return renderCatalogForm(ctx, {
      formMode: 'edit',
      formKicker: 'Fiscal',
      formTitle: `Editar documento #${row.id}`,
      formSubtitle: 'Actualiza estado, snapshots y montos del comprobante.',
      formAction: `/admin/hotels/fiscal-documents/${row.id}/update`,
      submitLabel: 'Guardar cambios',
      backHref: '/admin/hotels/fiscal-documents',
      fields: await this.fields(),
      values: {
        reservationId: row.reservationId,
        customerId: row.customerId,
        documentType: row.documentType,
        documentNumber: row.documentNumber,
        status: row.status,
        currencyCode: row.currencyCode,
        customerNameSnapshot: row.customerNameSnapshot,
        customerDocumentSnapshot: row.customerDocumentSnapshot,
        taxNameSnapshot: row.taxNameSnapshot,
        taxNitSnapshot: row.taxNitSnapshot,
        taxNrcSnapshot: row.taxNrcSnapshot,
        taxAddressSnapshot: row.taxAddressSnapshot,
        subtotal: row.subtotal,
        ivaTotal: row.ivaTotal,
        tourismTaxTotal: row.tourismTaxTotal,
        totalAmount: row.totalAmount,
        issuedAt: row.issuedAt?.toISODate(),
        voidedAt: row.voidedAt?.toISODate(),
        voidReason: row.voidReason,
      },
    })
  }

  private async validateRefs(
    reservationId: number,
    customerId: number,
    redirect: string,
    ctx: HttpContext
  ) {
    const [reservation, customer] = await Promise.all([
      Reservation.find(reservationId),
      Customer.find(customerId),
    ])

    if (!reservation) {
      return respondConflictOrRedirect(ctx, 'reservationId no existe', redirect, 400)
    }

    if (!customer) {
      return respondConflictOrRedirect(ctx, 'customerId no existe', redirect, 400)
    }

    return null
  }

  async store(ctx: HttpContext) {
    const payload = await ctx.request.validateUsing(createFiscalDocumentValidator)

    const refError = await this.validateRefs(
      payload.reservationId,
      payload.customerId,
      '/admin/hotels/fiscal-documents/new',
      ctx
    )
    if (refError) return refError

    const status = (payload.status as FiscalDocument['status'] | undefined) ?? 'PENDING'
    if (status === 'VOIDED' && !payload.voidReason?.trim()) {
      return respondConflictOrRedirect(
        ctx,
        'Para estado VOIDED se requiere motivo de anulacion',
        '/admin/hotels/fiscal-documents/new',
        400
      )
    }

    const row = await FiscalDocument.create({
      reservationId: payload.reservationId,
      customerId: payload.customerId,
      documentType: payload.documentType as FiscalDocument['documentType'],
      documentNumber: payload.documentNumber,
      status,
      currencyCode: (payload.currencyCode ?? 'USD').toUpperCase(),
      customerNameSnapshot: payload.customerNameSnapshot,
      customerDocumentSnapshot: payload.customerDocumentSnapshot ?? null,
      taxNameSnapshot: payload.taxNameSnapshot ?? null,
      taxNitSnapshot: payload.taxNitSnapshot ?? null,
      taxNrcSnapshot: payload.taxNrcSnapshot ?? null,
      taxAddressSnapshot: payload.taxAddressSnapshot ?? null,
      subtotal: asMoney(payload.subtotal),
      ivaTotal: asMoney(payload.ivaTotal),
      tourismTaxTotal: asMoney(payload.tourismTaxTotal),
      totalAmount: asMoney(payload.totalAmount),
      issuedAt:
        status === 'ISSUED'
          ? payload.issuedAt
            ? DateTime.fromJSDate(payload.issuedAt)
            : DateTime.now()
          : null,
      generatedByUserId: payload.generatedByUserId ?? ctx.auth.user?.id ?? null,
      voidedByUserId: status === 'VOIDED' ? payload.voidedByUserId ?? ctx.auth.user?.id ?? null : null,
      voidedAt: status === 'VOIDED' ? (payload.voidedAt ? DateTime.fromJSDate(payload.voidedAt) : DateTime.now()) : null,
      voidReason: payload.voidReason ?? null,
      metadata: payload.metadata ?? null,
    })

    await AuditLogger.log(
      {
        action: 'CREATE',
        entity: 'fiscal_document',
        entityId: row.id,
        oldValues: null,
        newValues: row.serialize(),
        metadata: { source: 'admin.hotels.fiscalDocuments.store' },
      },
      ctx
    )

    return respondSuccessOrJson(ctx, 'Documento fiscal creado', '/admin/hotels/fiscal-documents', row, true)
  }

  async update(ctx: HttpContext) {
    const row = await FiscalDocument.findOrFail(ctx.params.id)
    const payload = await ctx.request.validateUsing(createFiscalDocumentValidator)

    const refError = await this.validateRefs(
      payload.reservationId,
      payload.customerId,
      `/admin/hotels/fiscal-documents/${row.id}/edit`,
      ctx
    )
    if (refError) return refError

    const status = (payload.status as FiscalDocument['status'] | undefined) ?? row.status
    if (status === 'VOIDED' && !(payload.voidReason ?? row.voidReason)?.trim()) {
      return respondConflictOrRedirect(
        ctx,
        'Para estado VOIDED se requiere motivo de anulacion',
        `/admin/hotels/fiscal-documents/${row.id}/edit`,
        400
      )
    }

    const previous = row.serialize()

    row.reservationId = payload.reservationId
    row.customerId = payload.customerId
    row.documentType = payload.documentType as FiscalDocument['documentType']
    row.documentNumber = payload.documentNumber
    row.status = status
    row.currencyCode = (payload.currencyCode ?? row.currencyCode).toUpperCase()
    row.customerNameSnapshot = payload.customerNameSnapshot
    row.customerDocumentSnapshot = payload.customerDocumentSnapshot ?? row.customerDocumentSnapshot
    row.taxNameSnapshot = payload.taxNameSnapshot ?? row.taxNameSnapshot
    row.taxNitSnapshot = payload.taxNitSnapshot ?? row.taxNitSnapshot
    row.taxNrcSnapshot = payload.taxNrcSnapshot ?? row.taxNrcSnapshot
    row.taxAddressSnapshot = payload.taxAddressSnapshot ?? row.taxAddressSnapshot
    row.subtotal = payload.subtotal ?? row.subtotal
    row.ivaTotal = payload.ivaTotal ?? row.ivaTotal
    row.tourismTaxTotal = payload.tourismTaxTotal ?? row.tourismTaxTotal
    row.totalAmount = payload.totalAmount ?? row.totalAmount
    row.issuedAt = payload.issuedAt ? DateTime.fromJSDate(payload.issuedAt) : row.issuedAt

    if (status === 'VOIDED') {
      row.voidedByUserId = payload.voidedByUserId ?? ctx.auth.user?.id ?? row.voidedByUserId
      row.voidedAt = payload.voidedAt ? DateTime.fromJSDate(payload.voidedAt) : row.voidedAt ?? DateTime.now()
      row.voidReason = payload.voidReason ?? row.voidReason
    }

    if (status === 'ISSUED' && !row.issuedAt) {
      row.issuedAt = DateTime.now()
    }

    row.metadata = payload.metadata ?? row.metadata

    await row.save()

    await AuditLogger.log(
      {
        action: 'UPDATE',
        entity: 'fiscal_document',
        entityId: row.id,
        oldValues: previous,
        newValues: row.serialize(),
        metadata: { source: 'admin.hotels.fiscalDocuments.update' },
      },
      ctx
    )

    return respondSuccessOrJson(ctx, 'Documento fiscal actualizado', '/admin/hotels/fiscal-documents', row)
  }
}
