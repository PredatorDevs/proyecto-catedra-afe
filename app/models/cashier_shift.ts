import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import Payment from '#models/payment'

export default class CashierShift extends BaseModel {
  public static table = 'cashier_shifts'

  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'shift_number' })
  declare shiftNumber: string

  @column({ columnName: 'opened_by_user_id' })
  declare openedByUserId: number

  @column({ columnName: 'closed_by_user_id' })
  declare closedByUserId: number | null

  @column()
  declare status: 'OPEN' | 'CLOSED' | 'CANCELLED'

  @column.dateTime({ columnName: 'opened_at' })
  declare openedAt: DateTime

  @column.dateTime({ columnName: 'closed_at' })
  declare closedAt: DateTime | null

  @column({ columnName: 'opening_amount' })
  declare openingAmount: number

  @column({ columnName: 'expected_cash_amount' })
  declare expectedCashAmount: number

  @column({ columnName: 'actual_cash_amount' })
  declare actualCashAmount: number | null

  @column({ columnName: 'difference_amount' })
  declare differenceAmount: number | null

  @column()
  declare notes: string | null

  @belongsTo(() => User, { foreignKey: 'openedByUserId' })
  declare openedByUser: BelongsTo<typeof User>

  @belongsTo(() => User, { foreignKey: 'closedByUserId' })
  declare closedByUser: BelongsTo<typeof User>

  @hasMany(() => Payment, { foreignKey: 'cashierShiftId' })
  declare payments: HasMany<typeof Payment>

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  declare updatedAt: DateTime | null
}
