import vine from '@vinejs/vine'

export const createReservationChargeValidator = vine.compile(
  vine.object({
    reservationId: vine.number().withoutDecimals().positive(),
    chargeCatalogId: vine.number().withoutDecimals().positive().optional(),
    chargeKind: vine.string().trim().in(['PRODUCT', 'SERVICE', 'PENALTY', 'EXTRA_GUEST', 'OTHER']).optional(),
    chargeStatus: vine.string().trim().in(['PENDING', 'PAID', 'BILLED', 'VOIDED']).optional(),
    concept: vine.string().trim().minLength(2).maxLength(255),
    quantity: vine.number().positive().optional(),
    unitPrice: vine.number().min(0).optional(),
    subtotal: vine.number().min(0).optional(),
    ivaTotal: vine.number().min(0).optional(),
    tourismTaxTotal: vine.number().min(0).optional(),
    totalAmount: vine.number().min(0).optional(),
    consumedAt: vine.date().optional(),
    addedByUserId: vine.number().withoutDecimals().positive().optional(),
    voidedByUserId: vine.number().withoutDecimals().positive().optional(),
    voidReason: vine.string().trim().optional(),
  })
)
