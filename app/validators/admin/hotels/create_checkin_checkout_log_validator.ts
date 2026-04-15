import vine from '@vinejs/vine'

export const createCheckinCheckoutLogValidator = vine.compile(
  vine.object({
    reservationId: vine.number().withoutDecimals().positive(),
    roomId: vine.number().withoutDecimals().positive().optional(),
    action: vine
      .string()
      .trim()
      .in(['CHECK_IN', 'CHECK_OUT', 'ROOM_CHANGE_OUT', 'ROOM_CHANGE_IN', 'NO_SHOW']),
    occurredAt: vine.date(),
    notes: vine.string().trim().optional(),
  })
)
