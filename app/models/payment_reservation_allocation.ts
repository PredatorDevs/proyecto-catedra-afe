import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Payment from '#models/payment'
import Reservation from '#models/reservation'

export default class PaymentReservationAllocation extends BaseModel {
  public static table = 'payment_reservation_allocations'

  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'payment_id' })
  declare paymentId: number

  @column({ columnName: 'reservation_id' })
  declare reservationId: number

  @column()
  declare amount: number

  @belongsTo(() => Payment, { foreignKey: 'paymentId' })
  declare payment: BelongsTo<typeof Payment>

  @belongsTo(() => Reservation, { foreignKey: 'reservationId' })
  declare reservation: BelongsTo<typeof Reservation>

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime
}
