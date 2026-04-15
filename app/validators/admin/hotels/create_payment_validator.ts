import vine from '@vinejs/vine'

export const createPaymentValidator = vine.compile(
  vine.object({
    paymentNumber: vine.string().trim().minLength(4).maxLength(40).optional(),
    reservationId: vine.number().withoutDecimals().positive(),
    paymentMethodId: vine.number().withoutDecimals().positive(),
    cashierShiftId: vine.number().withoutDecimals().positive().optional(),
    parentPaymentId: vine.number().withoutDecimals().positive().optional(),
    paymentCategory: vine
      .string()
      .trim()
      .in(['LODGING', 'ADDITIONAL_CHARGES', 'MIXED', 'REFUND', 'REVERSAL'])
      .optional(),
    status: vine
      .string()
      .trim()
      .in(['PENDING', 'REPORTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'VOIDED', 'REFUNDED'])
      .optional(),
    currencyCode: vine.string().trim().fixedLength(3).optional(),
    amount: vine.number().positive(),
    referenceNumber: vine.string().trim().maxLength(120).optional(),
    receiptNumber: vine.string().trim().maxLength(120).optional(),
    reportedAt: vine.date().optional(),
    paidAt: vine.date().optional(),
    approvedAt: vine.date().optional(),
    rejectedAt: vine.date().optional(),
    voidedAt: vine.date().optional(),
    remarks: vine.string().trim().optional(),
    recordedByUserId: vine.number().withoutDecimals().positive().optional(),
    approvedByUserId: vine.number().withoutDecimals().positive().optional(),
    voidedByUserId: vine.number().withoutDecimals().positive().optional(),
  })
)
