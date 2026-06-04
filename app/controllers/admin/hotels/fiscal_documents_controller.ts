import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import FiscalDocument from '#models/fiscal_document'
import FiscalDocumentItem from '#models/fiscal_document_item'
import FiscalDocumentPayment from '#models/fiscal_document_payment'
import CheckinCheckoutLog from '#models/checkin_checkout_log'
import Reservation from '#models/reservation'
import Customer from '#models/customer'
import Payment from '#models/payment'
import ReservationCharge from '#models/reservation_charge'
import Room from '#models/room'
import AuditLogger from '#services/audit_logger'
import FiscalDocumentPdfService from '#services/fiscal_document_pdf_service'
import ResendMailerService from '#services/resend_mailer_service'
import env from '#start/env'
import { createFiscalDocumentValidator } from '#validators/admin/hotels/create_fiscal_document_validator'
import { generateFiscalDocumentValidator } from '#validators/admin/hotels/generate_fiscal_document_validator'
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

function buildFiscalDocumentNumber(documentType: 'CONSUMER_FINAL' | 'CREDITO_FISCAL') {
  const stamp = DateTime.now().toFormat('yyyyLLddHHmmss')
  const rand = Math.floor(Math.random() * 9000) + 1000
  const prefix = documentType === 'CREDITO_FISCAL' ? 'CCF' : 'CF'
  return `${prefix}-${stamp}-${rand}`
}

function toTwoDecimals(value: number) {
  return Number(value.toFixed(2))
}

function isTruthyFlag(value: unknown) {
  if (typeof value === 'boolean') return value
  if (typeof value !== 'string') return false

  const normalized = value.trim().toLowerCase()
  return normalized === 'true' || normalized === '1' || normalized === 'on' || normalized === 'yes'
}

function escapeHtml(value: string | null | undefined) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

export default class FiscalDocumentsController {
  private pdfService = new FiscalDocumentPdfService()

  private mailerService = new ResendMailerService()

  private async loadDocumentWithDetails(id: number) {
    return FiscalDocument.query()
      .where('id', id)
      .preload('reservation')
      .preload('customer')
      .preload('items', (query) => query.orderBy('id', 'asc'))
      .preload('payments', (query) => query.orderBy('id', 'asc'))
      .first()
  }

  private buildMailHtml(document: FiscalDocument, reservationNumber: string) {
    const total = Number(document.totalAmount).toFixed(2)
    const subtotal = Number(document.subtotal).toFixed(2)
    const iva = Number(document.ivaTotal).toFixed(2)
    const tourismTax = Number(document.tourismTaxTotal).toFixed(2)
    const issuedAt = document.issuedAt?.toFormat('yyyy-LL-dd HH:mm') || '-'
    const customerName = escapeHtml(document.customerNameSnapshot)
    const customerDoc = escapeHtml(document.customerDocumentSnapshot || '-')
    const docNumber = escapeHtml(document.documentNumber)
    const reservation = escapeHtml(reservationNumber)
    const docType = escapeHtml(fiscalDocumentTypeLabel(document.documentType))
    const status = escapeHtml(fiscalDocumentStatusLabel(document.status))
    const currency = escapeHtml(document.currencyCode)

    return `
<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Documento Fiscal ${docNumber}</title>
  </head>
  <body style="margin:0;padding:0;background:#f2f5f9;font-family:Segoe UI,Arial,sans-serif;color:#0f172a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f2f5f9;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="640" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border:1px solid #d9e2ef;border-radius:14px;overflow:hidden;box-shadow:0 10px 30px rgba(15,23,42,0.08);">
            <tr>
              <td style="background:linear-gradient(120deg,#0f4c81,#0a7ca8);padding:24px 26px;color:#ffffff;">
                <div style="font-size:12px;letter-spacing:1.2px;text-transform:uppercase;opacity:0.9;">Hotel AFE</div>
                <div style="font-size:24px;font-weight:700;margin-top:6px;">Documento Fiscal Emitido</div>
                <div style="font-size:13px;margin-top:10px;opacity:0.9;">Adjuntamos el comprobante en PDF para control administrativo y contable.</div>
              </td>
            </tr>

            <tr>
              <td style="padding:24px 26px 8px 26px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:separate;border-spacing:0 10px;">
                  <tr>
                    <td style="background:#f8fbff;border:1px solid #dce8f8;border-radius:10px;padding:12px 14px;width:50%;vertical-align:top;">
                      <div style="font-size:11px;color:#4b5f77;text-transform:uppercase;letter-spacing:.8px;">Documento</div>
                      <div style="font-size:16px;font-weight:700;color:#0f2f4a;margin-top:4px;">${docNumber}</div>
                      <div style="font-size:12px;color:#334155;margin-top:4px;">${docType} · ${status}</div>
                    </td>
                    <td style="width:12px;"></td>
                    <td style="background:#f8fbff;border:1px solid #dce8f8;border-radius:10px;padding:12px 14px;width:50%;vertical-align:top;">
                      <div style="font-size:11px;color:#4b5f77;text-transform:uppercase;letter-spacing:.8px;">Reservación</div>
                      <div style="font-size:16px;font-weight:700;color:#0f2f4a;margin-top:4px;">${reservation}</div>
                      <div style="font-size:12px;color:#334155;margin-top:4px;">Emitido: ${escapeHtml(issuedAt)}</div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding:8px 26px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">
                  <tr>
                    <td style="background:#f8fafc;padding:10px 12px;font-size:12px;color:#334155;font-weight:600;width:40%;">Cliente</td>
                    <td style="padding:10px 12px;font-size:13px;color:#0f172a;">${customerName}</td>
                  </tr>
                  <tr>
                    <td style="background:#f8fafc;padding:10px 12px;font-size:12px;color:#334155;font-weight:600;">Documento cliente</td>
                    <td style="padding:10px 12px;font-size:13px;color:#0f172a;">${customerDoc}</td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding:14px 26px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;border:1px solid #d9e2ef;border-radius:10px;overflow:hidden;">
                  <tr>
                    <td style="padding:11px 12px;font-size:12px;color:#334155;background:#f8fafc;">Subtotal</td>
                    <td align="right" style="padding:11px 12px;font-size:13px;color:#0f172a;">${subtotal} ${currency}</td>
                  </tr>
                  <tr>
                    <td style="padding:11px 12px;font-size:12px;color:#334155;background:#f8fafc;">IVA</td>
                    <td align="right" style="padding:11px 12px;font-size:13px;color:#0f172a;">${iva} ${currency}</td>
                  </tr>
                  <tr>
                    <td style="padding:11px 12px;font-size:12px;color:#334155;background:#f8fafc;">Impuesto turismo</td>
                    <td align="right" style="padding:11px 12px;font-size:13px;color:#0f172a;">${tourismTax} ${currency}</td>
                  </tr>
                  <tr>
                    <td style="padding:12px;font-size:13px;color:#0b2239;font-weight:700;background:#eef5ff;">TOTAL</td>
                    <td align="right" style="padding:12px;font-size:16px;color:#0b2239;font-weight:800;background:#eef5ff;">${total} ${currency}</td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding:6px 26px 26px 26px;font-size:12px;color:#475569;line-height:1.5;">
                Este mensaje fue generado automáticamente por el módulo fiscal del Hotel AFE. Si necesitas soporte, responde a este correo con el número de documento.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
    `.trim()
  }

  private validateCustomerEligibilityForDocument(
    customer: Customer,
    documentType: FiscalDocument['documentType'],
    ctx: HttpContext,
    redirect: string
  ) {
    if (documentType === 'CREDITO_FISCAL' && customer.customerType !== 'COMPANY') {
      return respondConflictOrRedirect(
        ctx,
        'CREDITO_FISCAL solo puede emitirse para clientes de tipo empresa',
        redirect,
        400
      )
    }

    if (documentType === 'CREDITO_FISCAL') {
      if (!customer.taxName?.trim() || !customer.taxNit?.trim() || !customer.taxNrc?.trim() || !customer.taxAddress?.trim()) {
        return respondConflictOrRedirect(
          ctx,
          'Para CREDITO_FISCAL el cliente debe tener nombre fiscal, NIT, NRC y direccion fiscal',
          redirect,
          400
        )
      }
    }

    return null
  }

  private async buildUniqueDocumentNumber(documentType: 'CONSUMER_FINAL' | 'CREDITO_FISCAL') {
    for (let i = 0; i < 8; i++) {
      const candidate = buildFiscalDocumentNumber(documentType)
      const exists = await FiscalDocument.query().where('document_number', candidate).first()
      if (!exists) return candidate
    }

    throw new Error('No se pudo generar un numero de documento fiscal unico')
  }

  private nightsBetween(checkIn: DateTime, checkOut: DateTime) {
    const diffInDays = checkOut.diff(checkIn, 'days').days
    const rounded = Math.ceil(diffInDays)
    return Math.max(1, rounded)
  }

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
          extraActions: [
            {
              label: 'Descargar PDF',
              href: `/admin/hotels/fiscal-documents/${row.id}/pdf`,
              method: 'GET',
              buttonClass: 'btn-info',
              icon: 'invoice',
            },
            {
              label: 'Enviar correo',
              href: `/admin/hotels/fiscal-documents/${row.id}/send-email`,
              method: 'POST',
              buttonClass: 'btn-warning',
              icon: 'invoice',
              confirmMessage: 'Se enviara el documento fiscal por correo al cliente. Deseas continuar?',
            },
          ],
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

    const customer = await Customer.find(payload.customerId)
    if (!customer) {
      return respondConflictOrRedirect(ctx, 'customerId no existe', '/admin/hotels/fiscal-documents/new', 400)
    }

    const customerEligibilityError = this.validateCustomerEligibilityForDocument(
      customer,
      payload.documentType as FiscalDocument['documentType'],
      ctx,
      '/admin/hotels/fiscal-documents/new'
    )
    if (customerEligibilityError) return customerEligibilityError

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

    const customer = await Customer.find(payload.customerId)
    if (!customer) {
      return respondConflictOrRedirect(ctx, 'customerId no existe', `/admin/hotels/fiscal-documents/${row.id}/edit`, 400)
    }

    const customerEligibilityError = this.validateCustomerEligibilityForDocument(
      customer,
      payload.documentType as FiscalDocument['documentType'],
      ctx,
      `/admin/hotels/fiscal-documents/${row.id}/edit`
    )
    if (customerEligibilityError) return customerEligibilityError

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

  async generateFromReservation(ctx: HttpContext) {
    const payload = await ctx.request.validateUsing(generateFiscalDocumentValidator)
    const autoCheckoutRequested = isTruthyFlag(ctx.request.input('autoCheckout'))

    const reservation = await Reservation.query().where('id', payload.reservationId).preload('customer').first()
    if (!reservation) {
      return respondConflictOrRedirect(ctx, 'reservationId no existe', '/admin/hotels/fiscal-documents/new', 400)
    }

    if (!['CHECKED_IN', 'CHECKED_OUT'].includes(reservation.status)) {
      return respondConflictOrRedirect(
        ctx,
        'Solo se puede generar fiscal para reservaciones en CHECKED_IN o CHECKED_OUT',
        '/admin/hotels/fiscal-documents/new',
        400
      )
    }

    if (reservation.status === 'CHECKED_IN' && !autoCheckoutRequested) {
      return respondConflictOrRedirect(
        ctx,
        'La reservacion esta CHECKED_IN. Para facturar desde aqui debes habilitar autoCheckout.',
        '/admin/hotels/fiscal-documents/new',
        400
      )
    }

    const documentType = payload.documentType as 'CONSUMER_FINAL' | 'CREDITO_FISCAL'
    const customer = reservation.customer

    const customerEligibilityError = this.validateCustomerEligibilityForDocument(
      customer,
      documentType,
      ctx,
      '/admin/hotels/fiscal-documents/new'
    )
    if (customerEligibilityError) return customerEligibilityError

    const existing = await FiscalDocument.query()
      .where('reservation_id', reservation.id)
      .whereIn('document_type', ['CONSUMER_FINAL', 'CREDITO_FISCAL'])
      .whereIn('status', ['PENDING', 'ISSUED'])
      .first()

    if (existing) {
      return respondConflictOrRedirect(
        ctx,
        'La reservacion ya tiene un documento fiscal activo',
        `/admin/hotels/fiscal-documents/${existing.id}/edit`,
        409
      )
    }

    const approvedPayments = await Payment.query()
      .where('reservation_id', reservation.id)
      .where('status', 'APPROVED')
      .orderBy('id', 'asc')

    if (approvedPayments.length === 0) {
      return respondConflictOrRedirect(
        ctx,
        'No hay pagos APPROVED para la reservacion',
        '/admin/hotels/fiscal-documents/new',
        400
      )
    }

    const activeCharges = await ReservationCharge.query()
      .where('reservation_id', reservation.id)
      .whereNot('charge_status', 'VOIDED')
      .orderBy('id', 'asc')

    const lodgingSubtotal = toTwoDecimals(
      Math.max(0, Number(reservation.totalAmount) - Number(reservation.ivaTotal) - Number(reservation.tourismTaxTotal))
    )
    const lodgingIva = toTwoDecimals(Number(reservation.ivaTotal))
    const lodgingTourism = toTwoDecimals(Number(reservation.tourismTaxTotal))
    const lodgingTotal = toTwoDecimals(Number(reservation.totalAmount))

    const additionalSubtotal = toTwoDecimals(
      activeCharges.reduce((acc, item) => acc + Number(item.subtotal), 0)
    )
    const additionalIva = toTwoDecimals(activeCharges.reduce((acc, item) => acc + Number(item.ivaTotal), 0))
    const additionalTourism = toTwoDecimals(
      activeCharges.reduce((acc, item) => acc + Number(item.tourismTaxTotal), 0)
    )
    const additionalTotal = toTwoDecimals(
      activeCharges.reduce((acc, item) => acc + Number(item.totalAmount), 0)
    )

    const fiscalSubtotal = toTwoDecimals(lodgingSubtotal + additionalSubtotal)
    const fiscalIva = toTwoDecimals(lodgingIva + additionalIva)
    const fiscalTourism = toTwoDecimals(lodgingTourism + additionalTourism)
    const fiscalTotal = toTwoDecimals(lodgingTotal + additionalTotal)

    const approvedTotal = toTwoDecimals(approvedPayments.reduce((acc, item) => acc + Number(item.amount), 0))
    if (approvedTotal + 0.0001 < fiscalTotal) {
      return respondConflictOrRedirect(
        ctx,
        'Los pagos APPROVED no cubren el total fiscal de la liquidacion',
        '/admin/hotels/fiscal-documents/new',
        400
      )
    }

    const documentNumber = await this.buildUniqueDocumentNumber(documentType)
    const issuedAt = DateTime.now()
    const generationUserId = ctx.auth.user?.id ?? null
    const nights = this.nightsBetween(reservation.checkInPlannedAt, reservation.checkOutPlannedAt)
    const shouldAutoCheckout = reservation.status === 'CHECKED_IN' && autoCheckoutRequested

    let createdDocument: FiscalDocument

    await db.transaction(async (trx) => {
      if (shouldAutoCheckout) {
        const occurredAt = DateTime.now()

        reservation.status = 'CHECKED_OUT'
        reservation.checkedOutAt = occurredAt
        reservation.updatedByUserId = generationUserId
        await reservation.useTransaction(trx).save()

        if (reservation.roomId) {
          const room = await Room.find(reservation.roomId, { client: trx })
          if (room) {
            room.currentStatus = 'DIRTY'
            room.updatedByUserId = generationUserId
            await room.useTransaction(trx).save()
          }
        }

        await CheckinCheckoutLog.create(
          {
            reservationId: reservation.id,
            roomId: reservation.roomId,
            action: 'CHECK_OUT',
            performedByUserId: generationUserId,
            occurredAt,
            notes: 'Checkout generado automaticamente durante facturacion fiscal',
          },
          { client: trx }
        )
      }

      createdDocument = await FiscalDocument.create(
        {
          reservationId: reservation.id,
          customerId: customer.id,
          documentType,
          documentNumber,
          status: 'ISSUED',
          currencyCode: (payload.currencyCode ?? 'USD').toUpperCase(),
          customerNameSnapshot: customer.fullName,
          customerDocumentSnapshot: customer.documentNumber,
          taxNameSnapshot: customer.taxName,
          taxNitSnapshot: customer.taxNit,
          taxNrcSnapshot: customer.taxNrc,
          taxAddressSnapshot: customer.taxAddress,
          subtotal: fiscalSubtotal,
          ivaTotal: fiscalIva,
          tourismTaxTotal: fiscalTourism,
          totalAmount: fiscalTotal,
          issuedAt,
          generatedByUserId: generationUserId,
          metadata: {
            generatedFrom: 'reservation_checkout',
            reservationNumber: reservation.reservationNumber,
            lodgingSourceTotal: lodgingTotal,
            additionalChargesTotal: additionalTotal,
          },
        },
        { client: trx }
      )

      await FiscalDocumentItem.create(
        {
          fiscalDocumentId: createdDocument.id,
          reservationChargeId: null,
          itemType: 'LODGING',
          description: `Hospedaje (${nights} noche(s))`,
          quantity: nights,
          unitPrice: nights > 0 ? toTwoDecimals(lodgingSubtotal / nights) : lodgingSubtotal,
          subtotal: lodgingSubtotal,
          ivaTotal: lodgingIva,
          tourismTaxTotal: lodgingTourism,
          totalAmount: lodgingTotal,
        },
        { client: trx }
      )

      for (const charge of activeCharges) {
        await FiscalDocumentItem.create(
          {
            fiscalDocumentId: createdDocument.id,
            reservationChargeId: charge.id,
            itemType: 'ADDITIONAL_CHARGE',
            description: charge.concept,
            quantity: Number(charge.quantity),
            unitPrice: Number(charge.unitPrice),
            subtotal: Number(charge.subtotal),
            ivaTotal: Number(charge.ivaTotal),
            tourismTaxTotal: Number(charge.tourismTaxTotal),
            totalAmount: Number(charge.totalAmount),
          },
          { client: trx }
        )

        if (charge.chargeStatus !== 'BILLED') {
          charge.chargeStatus = 'BILLED'
          await charge.useTransaction(trx).save()
        }
      }

      let remaining = fiscalTotal
      for (const payment of approvedPayments) {
        if (remaining <= 0) break

        const allocation = toTwoDecimals(Math.min(remaining, Number(payment.amount)))
        if (allocation <= 0) continue

        await FiscalDocumentPayment.create(
          {
            fiscalDocumentId: createdDocument.id,
            paymentId: payment.id,
            amount: allocation,
          },
          { client: trx }
        )

        remaining = toTwoDecimals(remaining - allocation)
      }

      if (remaining > 0) {
        throw new Error('No se pudo vincular pago suficiente para cubrir el documento fiscal')
      }
    })

    const row = createdDocument!

    await AuditLogger.log(
      {
        action: 'CREATE',
        entity: 'fiscal_document',
        entityId: row.id,
        oldValues: null,
        newValues: row.serialize(),
        metadata: { source: 'admin.hotels.fiscalDocuments.generateFromReservation' },
      },
      ctx
    )

    if (shouldAutoCheckout) {
      const autoCheckoutLog = await CheckinCheckoutLog.query()
        .where('reservation_id', reservation.id)
        .where('action', 'CHECK_OUT')
        .orderBy('id', 'desc')
        .first()

      if (!autoCheckoutLog) {
        return respondConflictOrRedirect(
          ctx,
          'Se genero el documento fiscal, pero no se encontro el log de checkout automatico',
          '/admin/hotels/fiscal-documents',
          400
        )
      }

      await AuditLogger.log(
        {
          action: 'CREATE',
          entity: 'checkin_checkout_log',
          entityId: autoCheckoutLog.id,
          oldValues: null,
          newValues: {
            reservationId: autoCheckoutLog.reservationId,
            roomId: autoCheckoutLog.roomId,
            action: autoCheckoutLog.action,
            occurredAt: autoCheckoutLog.occurredAt.toISO(),
          },
          metadata: { source: 'admin.hotels.fiscalDocuments.generateFromReservation.autoCheckout' },
        },
        ctx
      )
    }

    return respondSuccessOrJson(ctx, 'Documento fiscal generado desde checkout', '/admin/hotels/fiscal-documents', row, true)
  }

  async downloadPdf(ctx: HttpContext) {
    const row = await this.loadDocumentWithDetails(Number(ctx.params.id))
    if (!row) {
      return respondConflictOrRedirect(ctx, 'Documento fiscal no existe', '/admin/hotels/fiscal-documents', 400)
    }

    const pdfBuffer = await this.pdfService.buildPdfBuffer({
      document: row,
      items: row.items,
      payments: row.payments,
      reservationNumber: row.reservation.reservationNumber,
    })

    const filename = `fiscal-${row.documentNumber}.pdf`
    ctx.response.header('Content-Type', 'application/pdf')
    ctx.response.header('Content-Disposition', `attachment; filename="${filename}"`)
    ctx.response.header('Content-Length', String(pdfBuffer.length))

    return ctx.response.send(pdfBuffer)
  }

  async sendEmail(ctx: HttpContext) {
    const row = await this.loadDocumentWithDetails(Number(ctx.params.id))
    if (!row) {
      return respondConflictOrRedirect(ctx, 'Documento fiscal no existe', '/admin/hotels/fiscal-documents', 400)
    }

    const recipientEmail = row.customer.email || env.get('RESEND_TEST_RECIPIENT') || null
    if (!recipientEmail) {
      return respondConflictOrRedirect(
        ctx,
        'El cliente no tiene correo y no hay RESEND_TEST_RECIPIENT configurado',
        '/admin/hotels/fiscal-documents',
        400
      )
    }

    const pdfBuffer = await this.pdfService.buildPdfBuffer({
      document: row,
      items: row.items,
      payments: row.payments,
      reservationNumber: row.reservation.reservationNumber,
    })

    try {
      await this.mailerService.sendFiscalDocument({
        toEmail: recipientEmail,
        subject: `Documento fiscal ${row.documentNumber}`,
        html: this.buildMailHtml(row, row.reservation.reservationNumber),
        pdfBuffer,
        filename: `fiscal-${row.documentNumber}.pdf`,
      })
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'No se pudo enviar correo mediante Resend'
      return respondConflictOrRedirect(ctx, reason, '/admin/hotels/fiscal-documents', 400)
    }

    await AuditLogger.log(
      {
        action: 'SEND',
        entity: 'fiscal_document',
        entityId: row.id,
        oldValues: null,
        newValues: {
          sentTo: recipientEmail,
          documentNumber: row.documentNumber,
        },
        metadata: { source: 'admin.hotels.fiscalDocuments.sendEmail' },
      },
      ctx
    )

    return respondSuccessOrJson(
      ctx,
      `Correo enviado a ${recipientEmail}`,
      '/admin/hotels/fiscal-documents',
      { fiscalDocumentId: row.id, sentTo: recipientEmail }
    )
  }
}
