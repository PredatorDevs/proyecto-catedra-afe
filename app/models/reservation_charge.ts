import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Reservation from '#models/reservation'
import AdditionalChargeCatalog from '#models/additional_charge_catalog'
import User from '#models/user'

export default class ReservationCharge extends BaseModel {
  public static table = 'reservation_charges'

  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'reservation_id' })
  declare reservationId: number

  @column({ columnName: 'charge_catalog_id' })
  declare chargeCatalogId: number | null

  @column({ columnName: 'charge_kind' })
  declare chargeKind: 'PRODUCT' | 'SERVICE' | 'PENALTY' | 'EXTRA_GUEST' | 'OTHER'

  @column({ columnName: 'charge_status' })
  declare chargeStatus: 'PENDING' | 'PAID' | 'BILLED' | 'VOIDED'

  @column()
  declare concept: string

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

  @column.dateTime({ columnName: 'consumed_at' })
  declare consumedAt: DateTime | null

  @column({ columnName: 'added_by_user_id' })
  declare addedByUserId: number | null

  @column({ columnName: 'voided_by_user_id' })
  declare voidedByUserId: number | null

  @column({ columnName: 'void_reason' })
  declare voidReason: string | null

  @belongsTo(() => Reservation, { foreignKey: 'reservationId' })
  declare reservation: BelongsTo<typeof Reservation>

  @belongsTo(() => AdditionalChargeCatalog, { foreignKey: 'chargeCatalogId' })
  declare chargeCatalog: BelongsTo<typeof AdditionalChargeCatalog>

  @belongsTo(() => User, { foreignKey: 'addedByUserId' })
  declare addedByUser: BelongsTo<typeof User>

  @belongsTo(() => User, { foreignKey: 'voidedByUserId' })
  declare voidedByUser: BelongsTo<typeof User>

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  declare updatedAt: DateTime | null
}
