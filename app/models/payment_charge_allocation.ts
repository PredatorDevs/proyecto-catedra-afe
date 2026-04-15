import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Payment from '#models/payment'
import ReservationCharge from '#models/reservation_charge'

export default class PaymentChargeAllocation extends BaseModel {
  public static table = 'payment_charge_allocations'

  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'payment_id' })
  declare paymentId: number

  @column({ columnName: 'reservation_charge_id' })
  declare reservationChargeId: number

  @column()
  declare amount: number

  @belongsTo(() => Payment, { foreignKey: 'paymentId' })
  declare payment: BelongsTo<typeof Payment>

  @belongsTo(() => ReservationCharge, { foreignKey: 'reservationChargeId' })
  declare reservationCharge: BelongsTo<typeof ReservationCharge>

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime
}
