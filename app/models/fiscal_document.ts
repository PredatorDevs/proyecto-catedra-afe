import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Reservation from '#models/reservation'
import Customer from '#models/customer'
import User from '#models/user'
import FiscalDocumentItem from '#models/fiscal_document_item'
import FiscalDocumentPayment from '#models/fiscal_document_payment'

export default class FiscalDocument extends BaseModel {
  public static table = 'fiscal_documents'

  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'reservation_id' })
  declare reservationId: number

  @column({ columnName: 'customer_id' })
  declare customerId: number

  @column({ columnName: 'document_type' })
  declare documentType: 'CONSUMER_FINAL' | 'CREDITO_FISCAL' | 'NOTA_CREDITO' | 'ANULACION'

  @column({ columnName: 'document_number' })
  declare documentNumber: string

  @column()
  declare status: 'PENDING' | 'ISSUED' | 'VOIDED' | 'ERROR'

  @column({ columnName: 'currency_code' })
  declare currencyCode: string

  @column({ columnName: 'customer_name_snapshot' })
  declare customerNameSnapshot: string

  @column({ columnName: 'customer_document_snapshot' })
  declare customerDocumentSnapshot: string | null

  @column({ columnName: 'tax_name_snapshot' })
  declare taxNameSnapshot: string | null

  @column({ columnName: 'tax_nit_snapshot' })
  declare taxNitSnapshot: string | null

  @column({ columnName: 'tax_nrc_snapshot' })
  declare taxNrcSnapshot: string | null

  @column({ columnName: 'tax_address_snapshot' })
  declare taxAddressSnapshot: string | null

  @column()
  declare subtotal: number

  @column({ columnName: 'iva_total' })
  declare ivaTotal: number

  @column({ columnName: 'tourism_tax_total' })
  declare tourismTaxTotal: number

  @column({ columnName: 'total_amount' })
  declare totalAmount: number

  @column.dateTime({ columnName: 'issued_at' })
  declare issuedAt: DateTime | null

  @column({ columnName: 'generated_by_user_id' })
  declare generatedByUserId: number | null

  @column({ columnName: 'voided_by_user_id' })
  declare voidedByUserId: number | null

  @column.dateTime({ columnName: 'voided_at' })
  declare voidedAt: DateTime | null

  @column({ columnName: 'void_reason' })
  declare voidReason: string | null

  @column()
  declare metadata: Record<string, unknown> | null

  @belongsTo(() => Reservation, { foreignKey: 'reservationId' })
  declare reservation: BelongsTo<typeof Reservation>

  @belongsTo(() => Customer, { foreignKey: 'customerId' })
  declare customer: BelongsTo<typeof Customer>

  @belongsTo(() => User, { foreignKey: 'generatedByUserId' })
  declare generatedByUser: BelongsTo<typeof User>

  @belongsTo(() => User, { foreignKey: 'voidedByUserId' })
  declare voidedByUser: BelongsTo<typeof User>

  @hasMany(() => FiscalDocumentItem, { foreignKey: 'fiscalDocumentId' })
  declare items: HasMany<typeof FiscalDocumentItem>

  @hasMany(() => FiscalDocumentPayment, { foreignKey: 'fiscalDocumentId' })
  declare payments: HasMany<typeof FiscalDocumentPayment>

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  declare updatedAt: DateTime | null
}
