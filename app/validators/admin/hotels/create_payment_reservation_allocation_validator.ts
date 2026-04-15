import vine from '@vinejs/vine'

export const createPaymentReservationAllocationValidator = vine.compile(
  vine.object({
    paymentId: vine.number().withoutDecimals().positive(),
    reservationId: vine.number().withoutDecimals().positive(),
    amount: vine.number().positive(),
  })
)
