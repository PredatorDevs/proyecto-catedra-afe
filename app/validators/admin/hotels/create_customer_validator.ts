import vine from '@vinejs/vine'

export const createCustomerValidator = vine.compile(
  vine.object({
    userId: vine.number().withoutDecimals().positive().optional(),
    customerType: vine.string().trim().in(['INDIVIDUAL', 'COMPANY']),
    firstName: vine.string().trim().minLength(1).maxLength(120).optional(),
    lastName: vine.string().trim().minLength(1).maxLength(120).optional(),
    fullName: vine.string().trim().minLength(2).maxLength(255),
    email: vine.string().trim().email().maxLength(254).optional(),
    phone: vine.string().trim().maxLength(30).optional(),
    birthDate: vine.date().optional(),
    nationality: vine.string().trim().maxLength(100).optional(),
    documentType: vine.string().trim().in(['DUI', 'PASSPORT', 'NIT', 'OTHER']).optional(),
    documentNumber: vine.string().trim().maxLength(50).optional(),
    taxName: vine.string().trim().maxLength(255).optional(),
    taxNit: vine.string().trim().maxLength(30).optional(),
    taxNrc: vine.string().trim().maxLength(30).optional(),
    taxAddress: vine.string().trim().maxLength(500).optional(),
    notes: vine.string().trim().optional(),
    isActive: vine.boolean().optional(),
  })
)
