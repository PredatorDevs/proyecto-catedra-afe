import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import Room from '#models/room'
import RoomPrice from '#models/room_price'

export default class RoomType extends BaseModel {
  public static table = 'room_types'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare code: string

  @column()
  declare name: string

  @column()
  declare description: string | null

  @column({ columnName: 'base_capacity' })
  declare baseCapacity: number

  @column({ columnName: 'max_capacity' })
  declare maxCapacity: number

  @column({ columnName: 'bed_type' })
  declare bedType: string | null

  @column({ columnName: 'bed_count' })
  declare bedCount: number

  @column({ columnName: 'has_private_bathroom' })
  declare hasPrivateBathroom: boolean

  @column({ columnName: 'default_nightly_price' })
  declare defaultNightlyPrice: number

  @column({ columnName: 'is_active' })
  declare isActive: boolean

  @column({ columnName: 'created_by_user_id' })
  declare createdByUserId: number | null

  @column({ columnName: 'updated_by_user_id' })
  declare updatedByUserId: number | null

  @belongsTo(() => User, {
    foreignKey: 'createdByUserId',
  })
  declare createdByUser: BelongsTo<typeof User>

  @belongsTo(() => User, {
    foreignKey: 'updatedByUserId',
  })
  declare updatedByUser: BelongsTo<typeof User>

  @hasMany(() => Room, {
    foreignKey: 'roomTypeId',
  })
  declare rooms: HasMany<typeof Room>

  @hasMany(() => RoomPrice, {
    foreignKey: 'roomTypeId',
  })
  declare prices: HasMany<typeof RoomPrice>

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  declare updatedAt: DateTime | null
}
