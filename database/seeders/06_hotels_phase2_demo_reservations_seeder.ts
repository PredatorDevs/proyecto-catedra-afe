import User from '#models/user'
import Customer from '#models/customer'
import RoomType from '#models/room_type'
import Room from '#models/room'
import RoomPrice from '#models/room_price'
import Reservation from '#models/reservation'
import ReservationGuest from '#models/reservation_guest'
import AdditionalChargeCatalog from '#models/additional_charge_catalog'
import ReservationCharge from '#models/reservation_charge'
import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { DateTime } from 'luxon'

export default class extends BaseSeeder {
  async run() {
    const admin = await User.findByOrFail('email', 'admin@afe.local')
    const customer = await Customer.findByOrFail('customerCode', 'CUST-DEMO-001')
    const roomType = await RoomType.findByOrFail('code', 'STD_Q')
    const room = await Room.findByOrFail('roomNumber', '101')
    const roomPrice = await RoomPrice.findByOrFail('name', 'Tarifa base estandar demo')

    const reservation = await Reservation.updateOrCreate(
      { reservationNumber: 'RSV-DEMO-0001' },
      {
        reservationNumber: 'RSV-DEMO-0001',
        customerId: customer.id,
        roomTypeId: roomType.id,
        roomId: room.id,
        appliedRoomPriceId: roomPrice.id,
        source: 'RECEPTION',
        status: 'CONFIRMED',
        adultsCount: 2,
        childrenCount: 0,
        guestsCount: 2,
        checkInPlannedAt: DateTime.fromISO('2026-12-10T15:00:00'),
        checkOutPlannedAt: DateTime.fromISO('2026-12-12T12:00:00'),
        checkInDeadlineAt: DateTime.fromISO('2026-12-10T22:00:00'),
        expiresAt: null,
        confirmedAt: DateTime.fromISO('2026-12-01T10:00:00'),
        cancelledAt: null,
        checkedInAt: null,
        checkedOutAt: null,
        lodgingSubtotal: 160,
        discountTotal: 0,
        ivaTotal: 0,
        tourismTaxTotal: 0,
        totalAmount: 160,
        amountPaid: 0,
        balanceDue: 160,
        specialRequests: 'Llegada nocturna',
        internalNotes: 'Reserva demo para presentacion',
        cancellationReason: null,
        cancelledByUserId: null,
        createdByUserId: admin.id,
        updatedByUserId: admin.id,
      }
    )

    const primaryGuest = await ReservationGuest.query()
      .where('reservationId', reservation.id)
      .where('guestType', 'PRIMARY')
      .first()

    if (primaryGuest) {
      primaryGuest.merge({
        fullName: customer.fullName,
        email: customer.email,
        phone: customer.phone,
        documentType: customer.documentType,
        documentNumber: customer.documentNumber,
        isResponsible: true,
        notes: 'Huesped principal demo',
      })
      await primaryGuest.save()
    } else {
      await ReservationGuest.create({
        reservationId: reservation.id,
        guestType: 'PRIMARY',
        fullName: customer.fullName,
        email: customer.email,
        phone: customer.phone,
        documentType: customer.documentType,
        documentNumber: customer.documentNumber,
        isResponsible: true,
        notes: 'Huesped principal demo',
      })
    }

    const minibar = await AdditionalChargeCatalog.updateOrCreate(
      { chargeCode: 'MINIBAR_DEMO' },
      {
        chargeCode: 'MINIBAR_DEMO',
        name: 'Consumo minibar demo',
        description: 'Cargo de demostracion para fase 2',
        chargeKind: 'PRODUCT',
        unitOfMeasure: 'UNIT',
        unitPrice: 12,
        appliesIva: true,
        appliesTourismTax: false,
        allowManualPrice: true,
        isActive: true,
        createdByUserId: admin.id,
        updatedByUserId: admin.id,
      }
    )

    const existingCharge = await ReservationCharge.query()
      .where('reservationId', reservation.id)
      .where('concept', 'Consumo minibar demo')
      .first()

    if (existingCharge) {
      existingCharge.merge({
        chargeCatalogId: minibar.id,
        chargeKind: 'PRODUCT',
        chargeStatus: 'PENDING',
        quantity: 1,
        unitPrice: 12,
        subtotal: 12,
        ivaTotal: 0,
        tourismTaxTotal: 0,
        totalAmount: 12,
        consumedAt: DateTime.fromISO('2026-12-11T21:00:00'),
        addedByUserId: admin.id,
        voidedByUserId: null,
        voidReason: null,
      })
      await existingCharge.save()
    } else {
      await ReservationCharge.create({
        reservationId: reservation.id,
        chargeCatalogId: minibar.id,
        chargeKind: 'PRODUCT',
        chargeStatus: 'PENDING',
        concept: 'Consumo minibar demo',
        quantity: 1,
        unitPrice: 12,
        subtotal: 12,
        ivaTotal: 0,
        tourismTaxTotal: 0,
        totalAmount: 12,
        consumedAt: DateTime.fromISO('2026-12-11T21:00:00'),
        addedByUserId: admin.id,
        voidedByUserId: null,
        voidReason: null,
      })
    }
  }
}
