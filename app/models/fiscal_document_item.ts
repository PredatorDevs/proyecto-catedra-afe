import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import FiscalDocument from '#models/fiscal_document'
import ReservationCharge from '#models/reservation_charge'

export default class FiscalDocumentItem extends BaseModel {
  public static table = 'fiscal_document_items'

  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'fiscal_document_id' })
  declare fiscalDocumentId: number

  @column({ columnName: 'reservation_charge_id' })
  declare reservationChargeId: number | null

  @column({ columnName: 'item_type' })
  declare itemType: 'LODGING' | 'ADDITIONAL_CHARGE' | 'ADJUSTMENT'

  @column()
  declare description: string

  @column()
  declare quantity: number

  @column({ columnName: 'unit_price' })
  declare unitPrice: number

  @column()
  declare subtotal: number

  @column({ columnName: 'iva_total' })
  declare ivaTotal: number

  @column({ columnName: 'tourism_tax_total' })
  declare tourismTaxTotal: number

  @column({ columnName: 'total_amount' })
  declare totalAmount: number

  @belongsTo(() => FiscalDocument, { foreignKey: 'fiscalDocumentId' })
  declare fiscalDocument: BelongsTo<typeof FiscalDocument>

  @belongsTo(() => ReservationCharge, { foreignKey: 'reservationChargeId' })
  declare reservationCharge: BelongsTo<typeof ReservationCharge>

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime
}
