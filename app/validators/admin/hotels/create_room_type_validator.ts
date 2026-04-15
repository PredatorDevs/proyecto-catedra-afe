import vine from '@vinejs/vine'

export const createRoomTypeValidator = vine.compile(
  vine.object({
    code: vine.string().trim().minLength(2).maxLength(30),
    name: vine.string().trim().minLength(2).maxLength(120),
    description: vine.string().trim().optional(),
    baseCapacity: vine.number().withoutDecimals().positive(),
    maxCapacity: vine.number().withoutDecimals().positive(),
    bedType: vine.string().trim().maxLength(100).optional(),
    bedCount: vine.number().withoutDecimals().positive(),
    hasPrivateBathroom: vine.boolean().optional(),
    defaultNightlyPrice: vine.number().min(0),
    isActive: vine.boolean().optional(),
  })
)
