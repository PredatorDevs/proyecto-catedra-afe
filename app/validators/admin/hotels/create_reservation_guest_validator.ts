import vine from '@vinejs/vine'

export const createReservationGuestValidator = vine.compile(
  vine.object({
    reservationId: vine.number().withoutDecimals().positive(),
    guestType: vine.string().trim().in(['PRIMARY', 'ADDITIONAL']).optional(),
    fullName: vine.string().trim().minLength(3).maxLength(255),
    email: vine.string().trim().email().maxLength(254).optional(),
    phone: vine.string().trim().maxLength(30).optional(),
    documentType: vine.string().trim().in(['DUI', 'PASSPORT', 'NIT', 'OTHER']).optional(),
    documentNumber: vine.string().trim().maxLength(50).optional(),
    isResponsible: vine.boolean().optional(),
    notes: vine.string().trim().optional(),
  })
)
