import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import RoomType from '#models/room_type'
import RoomImage from '#models/room_image'
import RoomPrice from '#models/room_price'

export default class Room extends BaseModel {
  public static table = 'rooms'

  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'room_type_id' })
  declare roomTypeId: number

  @column({ columnName: 'room_number' })
  declare roomNumber: string

  @column()
  declare name: string | null

  @column({ columnName: 'floor_number' })
  declare floorNumber: number | null

  @column({ columnName: 'current_status' })
  declare currentStatus:
    | 'AVAILABLE_CLEAN'
    | 'RESERVED'
    | 'OCCUPIED'
    | 'DIRTY'
    | 'CLEANING_IN_PROGRESS'
    | 'INSPECTED'
    | 'BLOCKED'
    | 'MAINTENANCE'
    | 'OUT_OF_SERVICE'

  @column({ columnName: 'is_smoking_allowed' })
  declare isSmokingAllowed: boolean

  @column({ columnName: 'internal_notes' })
  declare internalNotes: string | null

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

  @belongsTo(() => User, {
    foreignKey: 'createdByUserId',
  })
  declare createdByUser: BelongsTo<typeof User>

  @belongsTo(() => User, {
    foreignKey: 'updatedByUserId',
  })
  declare updatedByUser: BelongsTo<typeof User>

  @hasMany(() => RoomImage, {
    foreignKey: 'roomId',
  })
  declare images: HasMany<typeof RoomImage>

  @hasMany(() => RoomPrice, {
    foreignKey: 'roomId',
  })
  declare prices: HasMany<typeof RoomPrice>

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  declare updatedAt: DateTime | null
}
