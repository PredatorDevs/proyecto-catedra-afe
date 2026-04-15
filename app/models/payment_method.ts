import { DateTime } from 'luxon'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import Payment from '#models/payment'

export default class PaymentMethod extends BaseModel {
  public static table = 'payment_methods'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare code: string

  @column()
  declare name: string

  @column({ columnName: 'requires_reference' })
  declare requiresReference: boolean

  @column({ columnName: 'requires_proof' })
  declare requiresProof: boolean

  @column({ columnName: 'is_cash' })
  declare isCash: boolean

  @column({ columnName: 'is_online' })
  declare isOnline: boolean

  @column({ columnName: 'is_active' })
  declare isActive: boolean

  @hasMany(() => Payment, { foreignKey: 'paymentMethodId' })
  declare payments: HasMany<typeof Payment>

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  declare updatedAt: DateTime | null
}
