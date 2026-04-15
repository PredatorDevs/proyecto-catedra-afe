import vine from '@vinejs/vine'

export const createAdditionalChargeCatalogValidator = vine.compile(
  vine.object({
    chargeCode: vine.string().trim().minLength(2).maxLength(40),
    name: vine.string().trim().minLength(2).maxLength(160),
    description: vine.string().trim().optional(),
    chargeKind: vine.string().trim().in(['PRODUCT', 'SERVICE', 'PENALTY', 'EXTRA_GUEST', 'OTHER']).optional(),
    unitOfMeasure: vine.string().trim().in(['UNIT', 'DAY', 'HOUR', 'PERSON', 'SERVICE']).optional(),
    unitPrice: vine.number().min(0).optional(),
    appliesIva: vine.boolean().optional(),
    appliesTourismTax: vine.boolean().optional(),
    allowManualPrice: vine.boolean().optional(),
    isActive: vine.boolean().optional(),
  })
)
