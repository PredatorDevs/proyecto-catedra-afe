import vine from '@vinejs/vine'

export const createSeasonValidator = vine.compile(
  vine.object({
    code: vine.string().trim().minLength(2).maxLength(30),
    name: vine.string().trim().minLength(2).maxLength(120),
    seasonType: vine.string().trim().in(['HIGH', 'LOW', 'PROMOTIONAL', 'SPECIAL']).optional(),
    startsAt: vine.date(),
    endsAt: vine.date(),
    priority: vine.number().withoutDecimals().min(0).optional(),
    isActive: vine.boolean().optional(),
  })
)
