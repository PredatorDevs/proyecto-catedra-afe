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

  @column({ columnName: 'request_id' })
  declare requestId: string | null

  @column({ columnName: 'old_values' })
  declare oldValues: Record<string, unknown> | null

  @column({ columnName: 'new_values' })
  declare newValues: Record<string, unknown> | null

  @column({
    columnName: 'changed_fields',
    prepare: (value: string[] | null) => {
      if (!value) {
        return null
      }

      return JSON.stringify(value)
    },
    consume: (value: unknown) => {
      if (!value) {
        return null
      }

      if (Array.isArray(value)) {
        return value.map((item) => String(item))
      }

      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value)
          if (Array.isArray(parsed)) {
            return parsed.map((item) => String(item))
          }

          if (typeof parsed === 'string') {
            return [parsed]
          }
        } catch {
          return [value]
        }
      }

      return null
    },
  })
  declare changedFields: string[] | null

  @column()
  declare metadata: Record<string, unknown> | null

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime
}
