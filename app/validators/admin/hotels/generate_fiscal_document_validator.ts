import vine from '@vinejs/vine'

export const generateFiscalDocumentValidator = vine.compile(
  vine.object({
    reservationId: vine.number().withoutDecimals().positive(),
    documentType: vine.string().trim().in(['CONSUMER_FINAL', 'CREDITO_FISCAL']),
    currencyCode: vine.string().trim().fixedLength(3).optional(),
    autoCheckout: vine.boolean().optional(),
  })
)
