import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'

export default class AdditionalChargeCatalog extends BaseModel {
  public static table = 'additional_charge_catalog'

  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'charge_code' })
  declare chargeCode: string

  @column()
  declare name: string

  @column()
  declare description: string | null

  @column({ columnName: 'charge_kind' })
  declare chargeKind: 'PRODUCT' | 'SERVICE' | 'PENALTY' | 'EXTRA_GUEST' | 'OTHER'

  @column({ columnName: 'unit_of_measure' })
  declare unitOfMeasure: 'UNIT' | 'DAY' | 'HOUR' | 'PERSON' | 'SERVICE'

  @column({ columnName: 'unit_price' })
  declare unitPrice: number

  @column({ columnName: 'applies_iva' })
  declare appliesIva: boolean

  @column({ columnName: 'applies_tourism_tax' })
  declare appliesTourismTax: boolean

  @column({ columnName: 'allow_manual_price' })
  declare allowManualPrice: boolean

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

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  declare updatedAt: DateTime | null
}
