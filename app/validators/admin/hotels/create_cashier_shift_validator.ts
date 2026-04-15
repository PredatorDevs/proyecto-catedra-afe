import vine from '@vinejs/vine'

export const createCashierShiftValidator = vine.compile(
  vine.object({
    shiftNumber: vine.string().trim().minLength(4).maxLength(40).optional(),
    openedByUserId: vine.number().withoutDecimals().positive().optional(),
    closedByUserId: vine.number().withoutDecimals().positive().optional(),
    status: vine.string().trim().in(['OPEN', 'CLOSED', 'CANCELLED']).optional(),
    openedAt: vine.date(),
    closedAt: vine.date().optional(),
    openingAmount: vine.number().min(0).optional(),
    expectedCashAmount: vine.number().min(0).optional(),
    actualCashAmount: vine.number().min(0).optional(),
    differenceAmount: vine.number().optional(),
    notes: vine.string().trim().optional(),
  })
)
