import vine from '@vinejs/vine'

export const createPaymentTransactionValidator = vine.compile(
  vine.object({
    paymentId: vine.number().withoutDecimals().positive(),
    provider: vine.string().trim().minLength(2).maxLength(80),
    externalTransactionId: vine.string().trim().maxLength(120).optional(),
    authorizationCode: vine.string().trim().maxLength(120).optional(),
    transactionStatus: vine.string().trim().minLength(2).maxLength(80),
    requestPayload: vine.any().optional(),
    responsePayload: vine.any().optional(),
    rawResponse: vine.any().optional(),
    processedAt: vine.date().optional(),
  })
)
