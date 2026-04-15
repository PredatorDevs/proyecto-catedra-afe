import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Reservation from '#models/reservation'
import PaymentMethod from '#models/payment_method'
import CashierShift from '#models/cashier_shift'
import User from '#models/user'
import PaymentProof from '#models/payment_proof'
import PaymentTransaction from '#models/payment_transaction'
import PaymentReservationAllocation from '#models/payment_reservation_allocation'
import PaymentChargeAllocation from '#models/payment_charge_allocation'
import FiscalDocumentPayment from '#models/fiscal_document_payment'

export default class Payment extends BaseModel {
  public static table = 'payments'

  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'payment_number' })
  declare paymentNumber: string

  @column({ columnName: 'reservation_id' })
  declare reservationId: number

  @column({ columnName: 'payment_method_id' })
  declare paymentMethodId: number

  @column({ columnName: 'cashier_shift_id' })
  declare cashierShiftId: number | null

  @column({ columnName: 'parent_payment_id' })
  declare parentPaymentId: number | null

  @column({ columnName: 'payment_category' })
  declare paymentCategory: 'LODGING' | 'ADDITIONAL_CHARGES' | 'MIXED' | 'REFUND' | 'REVERSAL'

  @column()
  declare status: 'PENDING' | 'REPORTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'VOIDED' | 'REFUNDED'

  @column({ columnName: 'currency_code' })
  declare currencyCode: string

  @column()
  declare amount: number

  @column({ columnName: 'reference_number' })
  declare referenceNumber: string | null

  @column({ columnName: 'receipt_number' })
  declare receiptNumber: string | null

  @column.dateTime({ columnName: 'reported_at' })
  declare reportedAt: DateTime | null

  @column.dateTime({ columnName: 'paid_at' })
  declare paidAt: DateTime | null

  @column.dateTime({ columnName: 'approved_at' })
  declare approvedAt: DateTime | null

  @column.dateTime({ columnName: 'rejected_at' })
  declare rejectedAt: DateTime | null

  @column.dateTime({ columnName: 'voided_at' })
  declare voidedAt: DateTime | null

  @column()
  declare remarks: string | null

  @column({ columnName: 'recorded_by_user_id' })
  declare recordedByUserId: number | null

  @column({ columnName: 'approved_by_user_id' })
  declare approvedByUserId: number | null

  @column({ columnName: 'voided_by_user_id' })
  declare voidedByUserId: number | null

  @belongsTo(() => Reservation, { foreignKey: 'reservationId' })
  declare reservation: BelongsTo<typeof Reservation>

  @belongsTo(() => PaymentMethod, { foreignKey: 'paymentMethodId' })
  declare paymentMethod: BelongsTo<typeof PaymentMethod>

  @belongsTo(() => CashierShift, { foreignKey: 'cashierShiftId' })
  declare cashierShift: BelongsTo<typeof CashierShift>

  @belongsTo(() => Payment, { foreignKey: 'parentPaymentId' })
  declare parentPayment: BelongsTo<typeof Payment>

  @belongsTo(() => User, { foreignKey: 'recordedByUserId' })
  declare recordedByUser: BelongsTo<typeof User>

  @belongsTo(() => User, { foreignKey: 'approvedByUserId' })
  declare approvedByUser: BelongsTo<typeof User>

  @belongsTo(() => User, { foreignKey: 'voidedByUserId' })
  declare voidedByUser: BelongsTo<typeof User>

  @hasMany(() => PaymentProof, { foreignKey: 'paymentId' })
  declare proofs: HasMany<typeof PaymentProof>

  @hasMany(() => PaymentTransaction, { foreignKey: 'paymentId' })
  declare transactions: HasMany<typeof PaymentTransaction>

  @hasMany(() => PaymentReservationAllocation, { foreignKey: 'paymentId' })
  declare reservationAllocations: HasMany<typeof PaymentReservationAllocation>

  @hasMany(() => PaymentChargeAllocation, { foreignKey: 'paymentId' })
  declare chargeAllocations: HasMany<typeof PaymentChargeAllocation>

  @hasMany(() => FiscalDocumentPayment, { foreignKey: 'paymentId' })
  declare fiscalDocumentPayments: HasMany<typeof FiscalDocumentPayment>

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  declare updatedAt: DateTime | null
}
