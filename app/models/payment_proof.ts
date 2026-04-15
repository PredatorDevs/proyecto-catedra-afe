import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Payment from '#models/payment'
import User from '#models/user'

export default class PaymentProof extends BaseModel {
  public static table = 'payment_proofs'

  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'payment_id' })
  declare paymentId: number

  @column({ columnName: 'file_path' })
  declare filePath: string

  @column({ columnName: 'original_name' })
  declare originalName: string | null

  @column({ columnName: 'mime_type' })
  declare mimeType: string | null

  @column({ columnName: 'file_size_bytes' })
  declare fileSizeBytes: number | null

  @column({ columnName: 'validation_status' })
  declare validationStatus: 'PENDING' | 'APPROVED' | 'REJECTED'

  @column({ columnName: 'uploaded_by_user_id' })
  declare uploadedByUserId: number | null

  @column({ columnName: 'validated_by_user_id' })
  declare validatedByUserId: number | null

  @column.dateTime({ columnName: 'validated_at' })
  declare validatedAt: DateTime | null

  @column()
  declare notes: string | null

  @belongsTo(() => Payment, { foreignKey: 'paymentId' })
  declare payment: BelongsTo<typeof Payment>

  @belongsTo(() => User, { foreignKey: 'uploadedByUserId' })
  declare uploadedByUser: BelongsTo<typeof User>

  @belongsTo(() => User, { foreignKey: 'validatedByUserId' })
  declare validatedByUser: BelongsTo<typeof User>

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime
}
