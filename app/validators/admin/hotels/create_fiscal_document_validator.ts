import vine from '@vinejs/vine'

export const createFiscalDocumentValidator = vine.compile(
  vine.object({
    reservationId: vine.number().withoutDecimals().positive(),
    customerId: vine.number().withoutDecimals().positive(),
    documentType: vine.string().trim().in(['CONSUMER_FINAL', 'CREDITO_FISCAL', 'NOTA_CREDITO', 'ANULACION']),
    documentNumber: vine.string().trim().minLength(3).maxLength(60),
    status: vine.string().trim().in(['PENDING', 'ISSUED', 'VOIDED', 'ERROR']).optional(),
    currencyCode: vine.string().trim().fixedLength(3).optional(),
    customerNameSnapshot: vine.string().trim().minLength(3).maxLength(255),
    customerDocumentSnapshot: vine.string().trim().maxLength(60).optional(),
    taxNameSnapshot: vine.string().trim().maxLength(255).optional(),
    taxNitSnapshot: vine.string().trim().maxLength(30).optional(),
    taxNrcSnapshot: vine.string().trim().maxLength(30).optional(),
    taxAddressSnapshot: vine.string().trim().maxLength(500).optional(),
    subtotal: vine.number().min(0).optional(),
    ivaTotal: vine.number().min(0).optional(),
    tourismTaxTotal: vine.number().min(0).optional(),
    totalAmount: vine.number().min(0).optional(),
    issuedAt: vine.date().optional(),
    generatedByUserId: vine.number().withoutDecimals().positive().optional(),
    voidedByUserId: vine.number().withoutDecimals().positive().optional(),
    voidedAt: vine.date().optional(),
    voidReason: vine.string().trim().optional(),
    metadata: vine.any().optional(),
  })
)
