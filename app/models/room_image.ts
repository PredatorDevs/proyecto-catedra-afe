import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Room from '#models/room'

export default class RoomImage extends BaseModel {
  public static table = 'room_images'

  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'room_id' })
  declare roomId: number

  @column({ columnName: 'image_url' })
  declare imageUrl: string

  @column()
  declare caption: string | null

  @column({ columnName: 'sort_order' })
  declare sortOrder: number

  @column({ columnName: 'is_cover' })
  declare isCover: boolean

  @belongsTo(() => Room, {
    foreignKey: 'roomId',
  })
  declare room: BelongsTo<typeof Room>

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime
}
