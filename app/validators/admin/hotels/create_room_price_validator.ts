import vine from '@vinejs/vine'

export const createRoomPriceValidator = vine.compile(
  vine.object({
    roomTypeId: vine.number().withoutDecimals().positive(),
    roomId: vine.number().withoutDecimals().positive().optional(),
    seasonId: vine.number().withoutDecimals().positive().optional(),
    name: vine.string().trim().minLength(2).maxLength(160),
    pricingScope: vine.string().trim().in(['ROOM_TYPE', 'ROOM']).optional(),
    priceBasis: vine.string().trim().in(['NIGHT', 'STAY']).optional(),
    validFrom: vine.date(),
    validTo: vine.date(),
    daysOfWeekMask: vine.string().trim().fixedLength(7).optional(),
    basePrice: vine.number().min(0),
    extraGuestPrice: vine.number().min(0).optional(),
    priority: vine.number().withoutDecimals().min(0).optional(),
    isActive: vine.boolean().optional(),
  })
)
