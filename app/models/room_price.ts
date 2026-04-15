import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import Room from '#models/room'
import RoomType from '#models/room_type'
import Season from '#models/season'

export default class RoomPrice extends BaseModel {
  public static table = 'room_prices'

  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'room_type_id' })
  declare roomTypeId: number

  @column({ columnName: 'room_id' })
  declare roomId: number | null

  @column({ columnName: 'season_id' })
  declare seasonId: number | null

  @column()
  declare name: string

  @column({ columnName: 'pricing_scope' })
  declare pricingScope: 'ROOM_TYPE' | 'ROOM'

  @column({ columnName: 'price_basis' })
  declare priceBasis: 'NIGHT' | 'STAY'

  @column.dateTime({ columnName: 'valid_from' })
  declare validFrom: DateTime

  @column.dateTime({ columnName: 'valid_to' })
  declare validTo: DateTime

  @column({ columnName: 'days_of_week_mask' })
  declare daysOfWeekMask: string

  @column({ columnName: 'base_price' })
  declare basePrice: number

  @column({ columnName: 'extra_guest_price' })
  declare extraGuestPrice: number

  @column()
  declare priority: number

  @column({ columnName: 'is_active' })
  declare isActive: boolean

  @column({ columnName: 'created_by_user_id' })
  declare createdByUserId: number | null

  @column({ columnName: 'updated_by_user_id' })
  declare updatedByUserId: number | null

  @belongsTo(() => RoomType, {
    foreignKey: 'roomTypeId',
  })
  declare roomType: BelongsTo<typeof RoomType>

  @belongsTo(() => Room, {
    foreignKey: 'roomId',
  })
  declare room: BelongsTo<typeof Room>

  @belongsTo(() => Season, {
    foreignKey: 'seasonId',
  })
  declare season: BelongsTo<typeof Season>

  @belongsTo(() => User, {
    foreignKey: 'createdByUserId',
  })
  declare createdByUser: BelongsTo<typeof User>

  @belongsTo(() => User, {
    foreignKey: 'updatedByUserId',
  })
  declare updatedByUser: BelongsTo<typeof User>

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  declare updatedAt: DateTime | null
}
