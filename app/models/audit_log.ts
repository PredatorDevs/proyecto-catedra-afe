import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'

export default class AuditLog extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'user_id' })
  declare userId: number | null

  @column()
  declare action: string

  @column()
  declare entity: string

  @column({ columnName: 'entity_id' })
  declare entityId: string | null

  @column()
  declare ip: string | null

  @column({ columnName: 'user_agent' })
  declare userAgent: string | null

  @column()
  declare metadata: Record<string, unknown> | null

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime
}
