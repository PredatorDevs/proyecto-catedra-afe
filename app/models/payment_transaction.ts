import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Payment from '#models/payment'

export default class PaymentTransaction extends BaseModel {
  public static table = 'payment_transactions'

  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'payment_id' })
  declare paymentId: number

  @column()
  declare provider: string

  @column({ columnName: 'external_transaction_id' })
  declare externalTransactionId: string | null

  @column({ columnName: 'authorization_code' })
  declare authorizationCode: string | null

  @column({ columnName: 'transaction_status' })
  declare transactionStatus: string

  @column({ columnName: 'request_payload' })
  declare requestPayload: Record<string, unknown> | null

  @column({ columnName: 'response_payload' })
  declare responsePayload: Record<string, unknown> | null

  @column({ columnName: 'raw_response' })
  declare rawResponse: Record<string, unknown> | null

  @column.dateTime({ columnName: 'processed_at' })
  declare processedAt: DateTime | null

  @belongsTo(() => Payment, { foreignKey: 'paymentId' })
  declare payment: BelongsTo<typeof Payment>

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime
}
