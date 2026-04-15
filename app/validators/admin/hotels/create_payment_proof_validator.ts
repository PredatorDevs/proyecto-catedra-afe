import vine from '@vinejs/vine'

export const createPaymentProofValidator = vine.compile(
  vine.object({
    paymentId: vine.number().withoutDecimals().positive(),
    filePath: vine.string().trim().minLength(5).maxLength(500),
    originalName: vine.string().trim().maxLength(255).optional(),
    mimeType: vine.string().trim().maxLength(100).optional(),
    fileSizeBytes: vine.number().withoutDecimals().positive().optional(),
    validationStatus: vine.string().trim().in(['PENDING', 'APPROVED', 'REJECTED']).optional(),
    uploadedByUserId: vine.number().withoutDecimals().positive().optional(),
    validatedByUserId: vine.number().withoutDecimals().positive().optional(),
    validatedAt: vine.date().optional(),
    notes: vine.string().trim().optional(),
  })
)
