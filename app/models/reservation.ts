import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Customer from '#models/customer'
import RoomType from '#models/room_type'
import Room from '#models/room'
import RoomPrice from '#models/room_price'
import User from '#models/user'
import ReservationGuest from '#models/reservation_guest'
import ReservationCharge from '#models/reservation_charge'
import CheckinCheckoutLog from '#models/checkin_checkout_log'

export default class Reservation extends BaseModel {
  public static table = 'reservations'

  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'reservation_number' })
  declare reservationNumber: string

  @column({ columnName: 'customer_id' })
  declare customerId: number

  @column({ columnName: 'room_type_id' })
  declare roomTypeId: number

  @column({ columnName: 'room_id' })
  declare roomId: number | null

  @column({ columnName: 'applied_room_price_id' })
  declare appliedRoomPriceId: number | null

  @column()
  declare source: 'WEB' | 'RECEPTION' | 'PHONE' | 'WALK_IN' | 'OTHER'

  @column()
  declare status:
    | 'DRAFT'
    | 'PENDING_ADMIN_CONFIRMATION'
    | 'PENDING_PAYMENT'
    | 'PAYMENT_UNDER_REVIEW'
    | 'CONFIRMED'
    | 'CHECKED_IN'
    | 'CHECKED_OUT'
    | 'CANCELLED'
    | 'EXPIRED'
    | 'NO_SHOW'
    | 'REFUND_PENDING'
    | 'REFUNDED'

  @column({ columnName: 'adults_count' })
  declare adultsCount: number

  @column({ columnName: 'children_count' })
  declare childrenCount: number

  @column({ columnName: 'guests_count' })
  declare guestsCount: number

  @column.dateTime({ columnName: 'check_in_planned_at' })
  declare checkInPlannedAt: DateTime

  @column.dateTime({ columnName: 'check_out_planned_at' })
  declare checkOutPlannedAt: DateTime

  @column.dateTime({ columnName: 'check_in_deadline_at' })
  declare checkInDeadlineAt: DateTime | null

  @column.dateTime({ columnName: 'expires_at' })
  declare expiresAt: DateTime | null

  @column.dateTime({ columnName: 'confirmed_at' })
  declare confirmedAt: DateTime | null

  @column.dateTime({ columnName: 'cancelled_at' })
  declare cancelledAt: DateTime | null

  @column.dateTime({ columnName: 'checked_in_at' })
  declare checkedInAt: DateTime | null

  @column.dateTime({ columnName: 'checked_out_at' })
  declare checkedOutAt: DateTime | null

  @column({ columnName: 'lodging_subtotal' })
  declare lodgingSubtotal: number

  @column({ columnName: 'discount_total' })
  declare discountTotal: number

  @column({ columnName: 'iva_total' })
  declare ivaTotal: number

  @column({ columnName: 'tourism_tax_total' })
  declare tourismTaxTotal: number

  @column({ columnName: 'total_amount' })
  declare totalAmount: number

  @column({ columnName: 'amount_paid' })
  declare amountPaid: number

  @column({ columnName: 'balance_due' })
  declare balanceDue: number

  @column({ columnName: 'special_requests' })
  declare specialRequests: string | null

  @column({ columnName: 'internal_notes' })
  declare internalNotes: string | null

  @column({ columnName: 'cancellation_reason' })
  declare cancellationReason: string | null

  @column({ columnName: 'cancelled_by_user_id' })
  declare cancelledByUserId: number | null

  @column({ columnName: 'created_by_user_id' })
  declare createdByUserId: number | null

  @column({ columnName: 'updated_by_user_id' })
  declare updatedByUserId: number | null

  @belongsTo(() => Customer, { foreignKey: 'customerId' })
  declare customer: BelongsTo<typeof Customer>

  @belongsTo(() => RoomType, { foreignKey: 'roomTypeId' })
  declare roomType: BelongsTo<typeof RoomType>

  @belongsTo(() => Room, { foreignKey: 'roomId' })
  declare room: BelongsTo<typeof Room>

  @belongsTo(() => RoomPrice, { foreignKey: 'appliedRoomPriceId' })
  declare appliedRoomPrice: BelongsTo<typeof RoomPrice>

  @belongsTo(() => User, { foreignKey: 'cancelledByUserId' })
  declare cancelledByUser: BelongsTo<typeof User>

  @belongsTo(() => User, { foreignKey: 'createdByUserId' })
  declare createdByUser: BelongsTo<typeof User>

  @belongsTo(() => User, { foreignKey: 'updatedByUserId' })
  declare updatedByUser: BelongsTo<typeof User>

  @hasMany(() => ReservationGuest, { foreignKey: 'reservationId' })
  declare guests: HasMany<typeof ReservationGuest>

  @hasMany(() => ReservationCharge, { foreignKey: 'reservationId' })
  declare charges: HasMany<typeof ReservationCharge>

  @hasMany(() => CheckinCheckoutLog, { foreignKey: 'reservationId' })
  declare checkinCheckoutLogs: HasMany<typeof CheckinCheckoutLog>

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  declare updatedAt: DateTime | null
}
