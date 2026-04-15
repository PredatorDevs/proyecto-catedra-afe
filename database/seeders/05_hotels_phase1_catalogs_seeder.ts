import User from '#models/user'
import Customer from '#models/customer'
import RoomType from '#models/room_type'
import Room from '#models/room'
import RoomPrice from '#models/room_price'
import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { DateTime } from 'luxon'

export default class extends BaseSeeder {
  async run() {
    const admin = await User.findByOrFail('email', 'admin@afe.local')

    const customerA = await Customer.updateOrCreate(
      { customerCode: 'CUST-DEMO-001' },
      {
        customerType: 'INDIVIDUAL',
        customerCode: 'CUST-DEMO-001',
        firstName: 'Carlos',
        lastName: 'Mendez',
        fullName: 'Carlos Mendez',
        email: 'cliente.demo1@afe.local',
        phone: '+50370000001',
        documentType: 'DUI',
        documentNumber: '01234567-8',
        isActive: true,
      }
    )

    await Customer.updateOrCreate(
      { customerCode: 'CUST-DEMO-002' },
      {
        customerType: 'INDIVIDUAL',
        customerCode: 'CUST-DEMO-002',
        firstName: 'Ana',
        lastName: 'Lopez',
        fullName: 'Ana Lopez',
        email: 'cliente.demo2@afe.local',
        phone: '+50370000002',
        documentType: 'PASSPORT',
        documentNumber: 'P-44332211',
        isActive: true,
      }
    )

    const standardType = await RoomType.updateOrCreate(
      { code: 'STD_Q' },
      {
        code: 'STD_Q',
        name: 'Estandar Queen',
        description: 'Habitacion estandar cama queen',
        baseCapacity: 2,
        maxCapacity: 3,
        bedType: 'QUEEN',
        bedCount: 1,
        hasPrivateBathroom: true,
        defaultNightlyPrice: 80,
        isActive: true,
        createdByUserId: admin.id,
        updatedByUserId: admin.id,
      }
    )

    const deluxeType = await RoomType.updateOrCreate(
      { code: 'DLX_K' },
      {
        code: 'DLX_K',
        name: 'Deluxe King',
        description: 'Habitacion amplia cama king',
        baseCapacity: 2,
        maxCapacity: 4,
        bedType: 'KING',
        bedCount: 1,
        hasPrivateBathroom: true,
        defaultNightlyPrice: 120,
        isActive: true,
        createdByUserId: admin.id,
        updatedByUserId: admin.id,
      }
    )

    const room101 = await Room.updateOrCreate(
      { roomNumber: '101' },
      {
        roomTypeId: standardType.id,
        roomNumber: '101',
        name: 'Habitacion 101',
        floorNumber: 1,
        currentStatus: 'AVAILABLE_CLEAN',
        isSmokingAllowed: false,
        internalNotes: null,
        isActive: true,
        createdByUserId: admin.id,
        updatedByUserId: admin.id,
      }
    )

    await Room.updateOrCreate(
      { roomNumber: '201' },
      {
        roomTypeId: deluxeType.id,
        roomNumber: '201',
        name: 'Habitacion 201',
        floorNumber: 2,
        currentStatus: 'AVAILABLE_CLEAN',
        isSmokingAllowed: false,
        internalNotes: null,
        isActive: true,
        createdByUserId: admin.id,
        updatedByUserId: admin.id,
      }
    )

    const validFrom = DateTime.fromISO('2026-01-01T00:00:00')
    const validTo = DateTime.fromISO('2027-12-31T23:59:59')

    await RoomPrice.updateOrCreate(
      { name: 'Tarifa base estandar demo' },
      {
        roomTypeId: standardType.id,
        roomId: null,
        seasonId: null,
        name: 'Tarifa base estandar demo',
        pricingScope: 'ROOM_TYPE',
        priceBasis: 'NIGHT',
        validFrom,
        validTo,
        daysOfWeekMask: '1111111',
        basePrice: 80,
        extraGuestPrice: 15,
        priority: 10,
        isActive: true,
        createdByUserId: admin.id,
        updatedByUserId: admin.id,
      }
    )

    await RoomPrice.updateOrCreate(
      { name: 'Tarifa base deluxe demo' },
      {
        roomTypeId: deluxeType.id,
        roomId: null,
        seasonId: null,
        name: 'Tarifa base deluxe demo',
        pricingScope: 'ROOM_TYPE',
        priceBasis: 'NIGHT',
        validFrom,
        validTo,
        daysOfWeekMask: '1111111',
        basePrice: 120,
        extraGuestPrice: 20,
        priority: 10,
        isActive: true,
        createdByUserId: admin.id,
        updatedByUserId: admin.id,
      }
    )

    // Keep one known customer available for phase 2 demo seed.
    void customerA
    void room101
  }
}
