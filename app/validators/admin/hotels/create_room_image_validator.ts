import vine from '@vinejs/vine'

export const createRoomImageValidator = vine.compile(
  vine.object({
    roomId: vine.number().withoutDecimals().positive(),
    imageUrl: vine.string().trim().url().maxLength(500),
    caption: vine.string().trim().maxLength(255).optional(),
    sortOrder: vine.number().withoutDecimals().min(0).optional(),
    isCover: vine.boolean().optional(),
  })
)
