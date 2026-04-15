import User from '#models/user'
import Role from '#models/role'
import Permission from '#models/permission'
import Customer from '#models/customer'
import RoomType from '#models/room_type'
import Room from '#models/room'
import Reservation from '#models/reservation'
import ReservationGuest from '#models/reservation_guest'
import ReservationCharge from '#models/reservation_charge'
import AuditLog from '#models/audit_log'
import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { DateTime } from 'luxon'

async function grantPermissionToUser(user: User, permissionSlug: string) {
  const permission = await Permission.updateOrCreate(
    { slug: permissionSlug },
    { slug: permissionSlug, name: permissionSlug }
  )

  const role = await Role.updateOrCreate(
    { slug: `role-${permissionSlug}` },
    { slug: `role-${permissionSlug}`, name: `Role ${permissionSlug}` }
  )

  await role.related('permissions').sync([permission.id])
  await user.related('roles').sync([role.id])
}

async function seedReservationBase(admin: User) {
  const customer = await Customer.create({
    customerType: 'INDIVIDUAL',
    fullName: `Cliente Reserva ${Date.now()}`,
    email: `reservation.customer.${Date.now()}@afe.local`,
    isActive: true,
  })

  const roomType = await RoomType.create({
    code: `R${Date.now()}`,
    name: 'Suite Test',
    description: null,
    baseCapacity: 2,
    maxCapacity: 3,
    bedType: 'QUEEN',
    bedCount: 1,
    hasPrivateBathroom: true,
    defaultNightlyPrice: 85,
    isActive: true,
    createdByUserId: admin.id,
    updatedByUserId: admin.id,
  })

  const room = await Room.create({
    roomTypeId: roomType.id,
    roomNumber: `R-${Math.floor(Math.random() * 10000)}`,
    name: 'Habitacion Test',
    floorNumber: 2,
    currentStatus: 'AVAILABLE_CLEAN',
    isSmokingAllowed: false,
    internalNotes: null,
    isActive: true,
    createdByUserId: admin.id,
    updatedByUserId: admin.id,
  })

  return { customer, roomType, room }
}

test.group('Hotels Phase 2 reservation endpoints', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('creates reservation with admin.access and writes audit log', async ({ client, assert }) => {
    const admin = await User.create({
      fullName: 'Reservations Admin',
      email: `reservations.admin.${Date.now()}@afe.local`,
      password: 'Secret12345',
    })

    await grantPermissionToUser(admin, 'admin.access')
    const { customer, roomType, room } = await seedReservationBase(admin)

    const reservationCode = `RSV-TEST-${Date.now()}`

    const response = await client.post('/admin/hotels/reservations').withGuard('web').loginAs(admin).form({
      reservationNumber: reservationCode,
      customerId: String(customer.id),
      roomTypeId: String(roomType.id),
      roomId: String(room.id),
      source: 'WEB',
      status: 'DRAFT',
      adultsCount: '2',
      childrenCount: '1',
      guestsCount: '3',
      checkInPlannedAt: '2026-06-10',
      checkOutPlannedAt: '2026-06-12',
      lodgingSubtotal: '160',
      discountTotal: '10',
      ivaTotal: '19.5',
      tourismTaxTotal: '3',
      amountPaid: '50',
    })

    response.assertStatus(201)

    const reservation = await Reservation.findBy('reservationNumber', reservationCode)
    assert.exists(reservation)

    const audit = await AuditLog.query()
      .where('action', 'CREATE')
      .where('entity', 'reservation')
      .andWhere('entity_id', String(reservation!.id))
      .first()

    assert.exists(audit)
  })

  test('rejects overlapping reservations for same room', async ({ client }) => {
    const admin = await User.create({
      fullName: 'Reservations Overlap Admin',
      email: `reservations.overlap.${Date.now()}@afe.local`,
      password: 'Secret12345',
    })

    await grantPermissionToUser(admin, 'admin.access')
    const { customer, roomType, room } = await seedReservationBase(admin)

    const firstResponse = await client.post('/admin/hotels/reservations').withGuard('web').loginAs(admin).form({
      reservationNumber: `RSV-A-${Date.now()}`,
      customerId: String(customer.id),
      roomTypeId: String(roomType.id),
      roomId: String(room.id),
      source: 'WEB',
      status: 'CONFIRMED',
      checkInPlannedAt: '2026-07-01',
      checkOutPlannedAt: '2026-07-05',
      lodgingSubtotal: '300',
    })

    firstResponse.assertStatus(201)

    const overlapResponse = await client
      .post('/admin/hotels/reservations')
      .withGuard('web')
      .loginAs(admin)
      .form({
        reservationNumber: `RSV-B-${Date.now()}`,
        customerId: String(customer.id),
        roomTypeId: String(roomType.id),
        roomId: String(room.id),
        source: 'WEB',
        status: 'CONFIRMED',
        checkInPlannedAt: '2026-07-03',
        checkOutPlannedAt: '2026-07-08',
        lodgingSubtotal: '320',
      })

    overlapResponse.assertStatus(400)
    overlapResponse.assertBodyContains({
      message: 'Existe una reservación solapada para la habitación seleccionada',
    })
  })

  test('rejects second PRIMARY guest for same reservation', async ({ client, assert }) => {
    const admin = await User.create({
      fullName: 'Reservations Guest Admin',
      email: `reservations.guests.${Date.now()}@afe.local`,
      password: 'Secret12345',
    })

    await grantPermissionToUser(admin, 'admin.access')
    const { customer, roomType, room } = await seedReservationBase(admin)

    const reservation = await Reservation.create({
      reservationNumber: `RSV-GUEST-${Date.now()}`,
      customerId: customer.id,
      roomTypeId: roomType.id,
      roomId: room.id,
      source: 'WEB',
      status: 'DRAFT',
      adultsCount: 1,
      childrenCount: 0,
      guestsCount: 1,
      checkInPlannedAt: DateTime.fromISO('2026-08-01'),
      checkOutPlannedAt: DateTime.fromISO('2026-08-03'),
      lodgingSubtotal: 100,
      discountTotal: 0,
      ivaTotal: 0,
      tourismTaxTotal: 0,
      totalAmount: 100,
      amountPaid: 0,
      balanceDue: 100,
      createdByUserId: admin.id,
      updatedByUserId: admin.id,
    })

    await ReservationGuest.create({
      reservationId: reservation.id,
      guestType: 'PRIMARY',
      fullName: 'Huesped Titular',
      email: null,
      phone: null,
      documentType: null,
      documentNumber: null,
      isResponsible: true,
      notes: null,
    })

    const response = await client
      .post('/admin/hotels/reservation-guests')
      .withGuard('web')
      .loginAs(admin)
      .form({
        reservationId: String(reservation.id),
        guestType: 'PRIMARY',
        fullName: 'Segundo Titular',
      })

    response.assertStatus(409)
    assert.equal(response.body().message, 'La reservacion ya tiene huesped principal')
  })

  test('creates reservation charge and computes totals', async ({ client, assert }) => {
    const admin = await User.create({
      fullName: 'Reservations Charges Admin',
      email: `reservations.charges.${Date.now()}@afe.local`,
      password: 'Secret12345',
    })

    await grantPermissionToUser(admin, 'admin.access')
    const { customer, roomType, room } = await seedReservationBase(admin)

    const reservation = await Reservation.create({
      reservationNumber: `RSV-CHG-${Date.now()}`,
      customerId: customer.id,
      roomTypeId: roomType.id,
      roomId: room.id,
      source: 'WEB',
      status: 'CONFIRMED',
      adultsCount: 2,
      childrenCount: 0,
      guestsCount: 2,
      checkInPlannedAt: DateTime.fromISO('2026-09-10'),
      checkOutPlannedAt: DateTime.fromISO('2026-09-12'),
      lodgingSubtotal: 180,
      discountTotal: 0,
      ivaTotal: 0,
      tourismTaxTotal: 0,
      totalAmount: 180,
      amountPaid: 0,
      balanceDue: 180,
      createdByUserId: admin.id,
      updatedByUserId: admin.id,
    })

    const response = await client
      .post('/admin/hotels/reservation-charges')
      .withGuard('web')
      .loginAs(admin)
      .form({
        reservationId: String(reservation.id),
        chargeKind: 'SERVICE',
        chargeStatus: 'PENDING',
        concept: 'Late checkout',
        quantity: '2',
        unitPrice: '12',
        ivaTotal: '1',
        tourismTaxTotal: '2',
      })

    response.assertStatus(201)

    const charge = await ReservationCharge.query()
      .where('reservation_id', reservation.id)
      .andWhere('concept', 'Late checkout')
      .first()

    assert.exists(charge)
    assert.equal(Number(charge!.subtotal), 24)
    assert.equal(Number(charge!.totalAmount), 27)
  })

  test('rejects invalid reservation status transition on update', async ({ client }) => {
    const admin = await User.create({
      fullName: 'Reservations Transition Admin',
      email: `reservations.transition.${Date.now()}@afe.local`,
      password: 'Secret12345',
    })

    await grantPermissionToUser(admin, 'admin.access')
    const { customer, roomType, room } = await seedReservationBase(admin)

    const reservation = await Reservation.create({
      reservationNumber: `RSV-TR-${Date.now()}`,
      customerId: customer.id,
      roomTypeId: roomType.id,
      roomId: room.id,
      source: 'WEB',
      status: 'DRAFT',
      adultsCount: 1,
      childrenCount: 0,
      guestsCount: 1,
      checkInPlannedAt: DateTime.fromISO('2026-10-01'),
      checkOutPlannedAt: DateTime.fromISO('2026-10-03'),
      lodgingSubtotal: 120,
      discountTotal: 0,
      ivaTotal: 0,
      tourismTaxTotal: 0,
      totalAmount: 120,
      amountPaid: 0,
      balanceDue: 120,
      createdByUserId: admin.id,
      updatedByUserId: admin.id,
    })

    const response = await client
      .post(`/admin/hotels/reservations/${reservation.id}/update`)
      .withGuard('web')
      .loginAs(admin)
      .form({
        reservationNumber: reservation.reservationNumber,
        customerId: String(customer.id),
        roomTypeId: String(roomType.id),
        roomId: String(room.id),
        source: 'WEB',
        status: 'CHECKED_OUT',
        adultsCount: '1',
        childrenCount: '0',
        guestsCount: '1',
        checkInPlannedAt: '2026-10-01',
        checkOutPlannedAt: '2026-10-03',
        lodgingSubtotal: '120',
      })

    response.assertStatus(400)
  })

  test('check-in and check-out logs sync reservation and room statuses', async ({ client, assert }) => {
    const admin = await User.create({
      fullName: 'Reservations Ops Admin',
      email: `reservations.ops.${Date.now()}@afe.local`,
      password: 'Secret12345',
    })

    await grantPermissionToUser(admin, 'admin.access')
    const { customer, roomType, room } = await seedReservationBase(admin)

    const reservation = await Reservation.create({
      reservationNumber: `RSV-OPS-${Date.now()}`,
      customerId: customer.id,
      roomTypeId: roomType.id,
      roomId: room.id,
      source: 'WEB',
      status: 'CONFIRMED',
      adultsCount: 1,
      childrenCount: 0,
      guestsCount: 1,
      checkInPlannedAt: DateTime.fromISO('2026-10-05'),
      checkOutPlannedAt: DateTime.fromISO('2026-10-07'),
      lodgingSubtotal: 150,
      discountTotal: 0,
      ivaTotal: 0,
      tourismTaxTotal: 0,
      totalAmount: 150,
      amountPaid: 0,
      balanceDue: 150,
      createdByUserId: admin.id,
      updatedByUserId: admin.id,
    })

    const checkin = await client
      .post('/admin/hotels/checkin-checkout-logs')
      .withGuard('web')
      .loginAs(admin)
      .form({
        reservationId: String(reservation.id),
        roomId: String(room.id),
        action: 'CHECK_IN',
        occurredAt: '2026-10-05',
      })

    checkin.assertStatus(201)

    await reservation.refresh()
    await room.refresh()
    assert.equal(reservation.status, 'CHECKED_IN')
    assert.equal(room.currentStatus, 'OCCUPIED')

    const checkout = await client
      .post('/admin/hotels/checkin-checkout-logs')
      .withGuard('web')
      .loginAs(admin)
      .form({
        reservationId: String(reservation.id),
        roomId: String(room.id),
        action: 'CHECK_OUT',
        occurredAt: '2026-10-07',
      })

    checkout.assertStatus(201)

    await reservation.refresh()
    await room.refresh()
    assert.equal(reservation.status, 'CHECKED_OUT')
    assert.equal(room.currentStatus, 'DIRTY')
  })

  test('rejects check-in when reservation is not confirmed', async ({ client }) => {
    const admin = await User.create({
      fullName: 'Reservations Invalid Ops Admin',
      email: `reservations.invalid.ops.${Date.now()}@afe.local`,
      password: 'Secret12345',
    })

    await grantPermissionToUser(admin, 'admin.access')
    const { customer, roomType, room } = await seedReservationBase(admin)

    const reservation = await Reservation.create({
      reservationNumber: `RSV-INV-${Date.now()}`,
      customerId: customer.id,
      roomTypeId: roomType.id,
      roomId: room.id,
      source: 'WEB',
      status: 'DRAFT',
      adultsCount: 1,
      childrenCount: 0,
      guestsCount: 1,
      checkInPlannedAt: DateTime.fromISO('2026-10-10'),
      checkOutPlannedAt: DateTime.fromISO('2026-10-12'),
      lodgingSubtotal: 140,
      discountTotal: 0,
      ivaTotal: 0,
      tourismTaxTotal: 0,
      totalAmount: 140,
      amountPaid: 0,
      balanceDue: 140,
      createdByUserId: admin.id,
      updatedByUserId: admin.id,
    })

    const response = await client
      .post('/admin/hotels/checkin-checkout-logs')
      .withGuard('web')
      .loginAs(admin)
      .form({
        reservationId: String(reservation.id),
        roomId: String(room.id),
        action: 'CHECK_IN',
        occurredAt: '2026-10-10',
      })

    response.assertStatus(409)
  })

  test('enforces void requirements and blocks updates for closed charges', async ({ client }) => {
    const admin = await User.create({
      fullName: 'Reservations Charge Guard Admin',
      email: `reservations.charge.guard.${Date.now()}@afe.local`,
      password: 'Secret12345',
    })

    await grantPermissionToUser(admin, 'admin.access')
    const { customer, roomType, room } = await seedReservationBase(admin)

    const reservation = await Reservation.create({
      reservationNumber: `RSV-CG-${Date.now()}`,
      customerId: customer.id,
      roomTypeId: roomType.id,
      roomId: room.id,
      source: 'WEB',
      status: 'CONFIRMED',
      adultsCount: 1,
      childrenCount: 0,
      guestsCount: 1,
      checkInPlannedAt: DateTime.fromISO('2026-10-15'),
      checkOutPlannedAt: DateTime.fromISO('2026-10-16'),
      lodgingSubtotal: 90,
      discountTotal: 0,
      ivaTotal: 0,
      tourismTaxTotal: 0,
      totalAmount: 90,
      amountPaid: 0,
      balanceDue: 90,
      createdByUserId: admin.id,
      updatedByUserId: admin.id,
    })

    const createCharge = await client
      .post('/admin/hotels/reservation-charges')
      .withGuard('web')
      .loginAs(admin)
      .form({
        reservationId: String(reservation.id),
        chargeKind: 'SERVICE',
        chargeStatus: 'PENDING',
        concept: 'Minibar',
        quantity: '1',
        unitPrice: '5',
      })

    createCharge.assertStatus(201)

    const charge = await ReservationCharge.findByOrFail('concept', 'Minibar')

    const invalidVoid = await client
      .post(`/admin/hotels/reservation-charges/${charge.id}/update`)
      .withGuard('web')
      .loginAs(admin)
      .form({
        reservationId: String(reservation.id),
        chargeKind: 'SERVICE',
        chargeStatus: 'VOIDED',
        concept: 'Minibar',
        quantity: '1',
        unitPrice: '5',
      })

    invalidVoid.assertStatus(400)

    const validVoid = await client
      .post(`/admin/hotels/reservation-charges/${charge.id}/update`)
      .withGuard('web')
      .loginAs(admin)
      .form({
        reservationId: String(reservation.id),
        chargeKind: 'SERVICE',
        chargeStatus: 'VOIDED',
        concept: 'Minibar',
        quantity: '1',
        unitPrice: '5',
        voidReason: 'Error de digitacion',
      })

    validVoid.assertStatus(200)

    const closedEdit = await client
      .post(`/admin/hotels/reservation-charges/${charge.id}/update`)
      .withGuard('web')
      .loginAs(admin)
      .form({
        reservationId: String(reservation.id),
        chargeKind: 'SERVICE',
        chargeStatus: 'VOIDED',
        concept: 'Minibar corregido',
        quantity: '1',
        unitPrice: '5',
        voidReason: 'Intento de cambio',
      })

    closedEdit.assertStatus(409)
  })
})
