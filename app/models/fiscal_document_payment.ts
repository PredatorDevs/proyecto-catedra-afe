import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import FiscalDocument from '#models/fiscal_document'
import Payment from '#models/payment'

export default class FiscalDocumentPayment extends BaseModel {
  public static table = 'fiscal_document_payments'

  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'fiscal_document_id' })
  declare fiscalDocumentId: number

  @column({ columnName: 'payment_id' })
  declare paymentId: number

  @column()
  declare amount: number

  @belongsTo(() => FiscalDocument, { foreignKey: 'fiscalDocumentId' })
  declare fiscalDocument: BelongsTo<typeof FiscalDocument>

  @belongsTo(() => Payment, { foreignKey: 'paymentId' })
  declare payment: BelongsTo<typeof Payment>

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime
}
