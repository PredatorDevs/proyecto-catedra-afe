import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import RoomPrice from '#models/room_price'

export default class Season extends BaseModel {
  public static table = 'seasons'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare code: string

  @column()
  declare name: string

  @column({ columnName: 'season_type' })
  declare seasonType: 'HIGH' | 'LOW' | 'PROMOTIONAL' | 'SPECIAL'

  @column.dateTime({ columnName: 'starts_at' })
  declare startsAt: DateTime

  @column.dateTime({ columnName: 'ends_at' })
  declare endsAt: DateTime

  @column()
  declare priority: number

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

  @hasMany(() => RoomPrice, {
    foreignKey: 'seasonId',
  })
  declare prices: HasMany<typeof RoomPrice>

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  declare updatedAt: DateTime | null
}
