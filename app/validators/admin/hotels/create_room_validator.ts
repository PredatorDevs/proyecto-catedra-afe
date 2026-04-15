import vine from '@vinejs/vine'

export const createRoomValidator = vine.compile(
  vine.object({
    roomTypeId: vine.number().withoutDecimals().positive(),
    roomNumber: vine.string().trim().minLength(1).maxLength(20),
    name: vine.string().trim().maxLength(120).optional(),
    floorNumber: vine.number().withoutDecimals().optional(),
    currentStatus: vine
      .string()
      .trim()
      .in([
        'AVAILABLE_CLEAN',
        'RESERVED',
        'OCCUPIED',
        'DIRTY',
        'CLEANING_IN_PROGRESS',
        'INSPECTED',
        'BLOCKED',
        'MAINTENANCE',
        'OUT_OF_SERVICE',
      ])
      .optional(),
    isSmokingAllowed: vine.boolean().optional(),
    internalNotes: vine.string().trim().optional(),
    isActive: vine.boolean().optional(),
  })
)
