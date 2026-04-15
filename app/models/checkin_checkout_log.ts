import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Reservation from '#models/reservation'
import Room from '#models/room'
import User from '#models/user'

export default class CheckinCheckoutLog extends BaseModel {
  public static table = 'checkin_checkout_logs'

  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'reservation_id' })
  declare reservationId: number

  @column({ columnName: 'room_id' })
  declare roomId: number | null

  @column()
  declare action: 'CHECK_IN' | 'CHECK_OUT' | 'ROOM_CHANGE_OUT' | 'ROOM_CHANGE_IN' | 'NO_SHOW'

  @column({ columnName: 'performed_by_user_id' })
  declare performedByUserId: number | null

  @column.dateTime({ columnName: 'occurred_at' })
  declare occurredAt: DateTime

  @column()
  declare notes: string | null

  @belongsTo(() => Reservation, { foreignKey: 'reservationId' })
  declare reservation: BelongsTo<typeof Reservation>

  @belongsTo(() => Room, { foreignKey: 'roomId' })
  declare room: BelongsTo<typeof Room>

  @belongsTo(() => User, { foreignKey: 'performedByUserId' })
  declare performedByUser: BelongsTo<typeof User>

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime
}
