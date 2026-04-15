import vine from '@vinejs/vine'

export const createPaymentMethodValidator = vine.compile(
  vine.object({
    code: vine.string().trim().minLength(2).maxLength(30),
    name: vine.string().trim().minLength(2).maxLength(120),
    requiresReference: vine.boolean().optional(),
    requiresProof: vine.boolean().optional(),
    isCash: vine.boolean().optional(),
    isOnline: vine.boolean().optional(),
    isActive: vine.boolean().optional(),
  })
)
