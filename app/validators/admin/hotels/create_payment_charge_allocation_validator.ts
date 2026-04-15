import vine from '@vinejs/vine'

export const createPaymentChargeAllocationValidator = vine.compile(
  vine.object({
    paymentId: vine.number().withoutDecimals().positive(),
    reservationChargeId: vine.number().withoutDecimals().positive(),
    amount: vine.number().positive(),
  })
)
