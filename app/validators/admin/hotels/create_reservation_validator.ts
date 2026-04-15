import vine from '@vinejs/vine'

export const createReservationValidator = vine.compile(
  vine.object({
    reservationNumber: vine.string().trim().minLength(4).maxLength(40).optional(),
    customerId: vine.number().withoutDecimals().positive(),
    roomTypeId: vine.number().withoutDecimals().positive(),
    roomId: vine.number().withoutDecimals().positive().optional(),
    appliedRoomPriceId: vine.number().withoutDecimals().positive().optional(),
    source: vine.string().trim().in(['WEB', 'RECEPTION', 'PHONE', 'WALK_IN', 'OTHER']).optional(),
    status: vine
      .string()
      .trim()
      .in([
        'DRAFT',
        'PENDING_ADMIN_CONFIRMATION',
        'PENDING_PAYMENT',
        'PAYMENT_UNDER_REVIEW',
        'CONFIRMED',
        'CHECKED_IN',
        'CHECKED_OUT',
        'CANCELLED',
        'EXPIRED',
        'NO_SHOW',
        'REFUND_PENDING',
        'REFUNDED',
      ])
      .optional(),
    adultsCount: vine.number().withoutDecimals().min(1).optional(),
    childrenCount: vine.number().withoutDecimals().min(0).optional(),
    guestsCount: vine.number().withoutDecimals().min(1).optional(),
    checkInPlannedAt: vine.date(),
    checkOutPlannedAt: vine.date(),
    checkInDeadlineAt: vine.date().optional(),
    expiresAt: vine.date().optional(),
    confirmedAt: vine.date().optional(),
    cancelledAt: vine.date().optional(),
    checkedInAt: vine.date().optional(),
    checkedOutAt: vine.date().optional(),
    lodgingSubtotal: vine.number().min(0).optional(),
    discountTotal: vine.number().min(0).optional(),
    ivaTotal: vine.number().min(0).optional(),
    tourismTaxTotal: vine.number().min(0).optional(),
    totalAmount: vine.number().min(0).optional(),
    amountPaid: vine.number().min(0).optional(),
    balanceDue: vine.number().min(0).optional(),
    specialRequests: vine.string().trim().optional(),
    internalNotes: vine.string().trim().optional(),
    cancellationReason: vine.string().trim().optional(),
    cancelledByUserId: vine.number().withoutDecimals().positive().optional(),
  })
)
