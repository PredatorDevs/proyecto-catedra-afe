import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Reservation from '#models/reservation'

export default class ReservationGuest extends BaseModel {
  public static table = 'reservation_guests'

  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'reservation_id' })
  declare reservationId: number

  @column({ columnName: 'guest_type' })
  declare guestType: 'PRIMARY' | 'ADDITIONAL'

  @column({ columnName: 'full_name' })
  declare fullName: string

  @column()
  declare email: string | null

  @column()
  declare phone: string | null

  @column({ columnName: 'document_type' })
  declare documentType: 'DUI' | 'PASSPORT' | 'NIT' | 'OTHER' | null

  @column({ columnName: 'document_number' })
  declare documentNumber: string | null

  @column({ columnName: 'is_responsible' })
  declare isResponsible: boolean

  @column()
  declare notes: string | null

  @belongsTo(() => Reservation, { foreignKey: 'reservationId' })
  declare reservation: BelongsTo<typeof Reservation>

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  declare updatedAt: DateTime | null
}
