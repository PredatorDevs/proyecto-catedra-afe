import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'

export default class Customer extends BaseModel {
  public static table = 'customers'

  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'user_id' })
  declare userId: number | null

  @column({ columnName: 'customer_code' })
  declare customerCode: string | null

  @column({ columnName: 'customer_type' })
  declare customerType: 'INDIVIDUAL' | 'COMPANY'

  @column({ columnName: 'first_name' })
  declare firstName: string | null

  @column({ columnName: 'last_name' })
  declare lastName: string | null

  @column({ columnName: 'full_name' })
  declare fullName: string

  @column()
  declare email: string | null

  @column()
  declare phone: string | null

  @column.date({ columnName: 'birth_date' })
  declare birthDate: DateTime | null

  @column()
  declare nationality: string | null

  @column({ columnName: 'document_type' })
  declare documentType: 'DUI' | 'PASSPORT' | 'NIT' | 'OTHER' | null

  @column({ columnName: 'document_number' })
  declare documentNumber: string | null

  @column({ columnName: 'tax_name' })
  declare taxName: string | null

  @column({ columnName: 'tax_nit' })
  declare taxNit: string | null

  @column({ columnName: 'tax_nrc' })
  declare taxNrc: string | null

  @column({ columnName: 'tax_address' })
  declare taxAddress: string | null

  @column()
  declare notes: string | null

  @column({ columnName: 'is_active' })
  declare isActive: boolean

  @belongsTo(() => User, {
    foreignKey: 'userId',
  })
  declare user: BelongsTo<typeof User>

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  declare updatedAt: DateTime | null
}
