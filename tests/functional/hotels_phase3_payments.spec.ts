import User from '#models/user'
import Role from '#models/role'
import Permission from '#models/permission'
import Customer from '#models/customer'
import RoomType from '#models/room_type'
import Room from '#models/room'
import Reservation from '#models/reservation'
import Payment from '#models/payment'
import PaymentMethod from '#models/payment_method'
import ReservationCharge from '#models/reservation_charge'
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
    fullName: `Cliente F3 ${Date.now()}`,
    email: `phase3.customer.${Date.now()}@afe.local`,
    isActive: true,
  })

  const roomType = await RoomType.create({
    code: `F3-${Date.now()}`,
    name: 'Suite Fase3',
    description: null,
    baseCapacity: 2,
    maxCapacity: 3,
    bedType: 'QUEEN',
    bedCount: 1,
    hasPrivateBathroom: true,
    defaultNightlyPrice: 90,
    isActive: true,
    createdByUserId: admin.id,
    updatedByUserId: admin.id,
  })

  const room = await Room.create({
    roomTypeId: roomType.id,
    roomNumber: `F3-${Math.floor(Math.random() * 10000)}`,
    name: 'Habitacion Fase3',
    floorNumber: 1,
    currentStatus: 'AVAILABLE_CLEAN',
    isSmokingAllowed: false,
    internalNotes: null,
    isActive: true,
    createdByUserId: admin.id,
    updatedByUserId: admin.id,
  })

  const reservation = await Reservation.create({
    reservationNumber: `RSV-F3-${Date.now()}`,
    customerId: customer.id,
    roomTypeId: roomType.id,
    roomId: room.id,
    source: 'WEB',
    status: 'CONFIRMED',
    adultsCount: 2,
    childrenCount: 0,
    guestsCount: 2,
    checkInPlannedAt: DateTime.fromISO('2026-12-01'),
    checkOutPlannedAt: DateTime.fromISO('2026-12-03'),
    lodgingSubtotal: 200,
    discountTotal: 0,
    ivaTotal: 0,
    tourismTaxTotal: 0,
    totalAmount: 200,
    amountPaid: 0,
    balanceDue: 200,
    createdByUserId: admin.id,
    updatedByUserId: admin.id,
  })

  return { customer, roomType, room, reservation }
}

test.group('Hotels Phase 3 payment endpoints', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('rejects payment when method requires reference and none provided', async ({ client }) => {
    const admin = await User.create({
      fullName: 'Phase3 Ref Admin',
      email: `phase3.ref.${Date.now()}@afe.local`,
      password: 'Secret12345',
    })

    await grantPermissionToUser(admin, 'admin.access')
    const { reservation } = await seedReservationBase(admin)

    const transfer = await PaymentMethod.create({
      code: `TR-${Date.now()}`,
      name: 'Transferencia',
      requiresReference: true,
      requiresProof: true,
      isCash: false,
      isOnline: true,
      isActive: true,
    })

    const response = await client.post('/admin/hotels/payments').withGuard('web').loginAs(admin).form({
      reservationId: String(reservation.id),
      paymentMethodId: String(transfer.id),
      paymentCategory: 'LODGING',
      status: 'PENDING',
      currencyCode: 'USD',
      amount: '50',
    })

    response.assertStatus(400)
    response.assertBodyContains({ message: 'El metodo seleccionado requiere referencia de pago' })
  })

  test('rejects cash payment without open cashier shift', async ({ client }) => {
    const admin = await User.create({
      fullName: 'Phase3 Cash Admin',
      email: `phase3.cash.${Date.now()}@afe.local`,
      password: 'Secret12345',
    })

    await grantPermissionToUser(admin, 'admin.access')
    const { reservation } = await seedReservationBase(admin)

    const cashMethod = await PaymentMethod.create({
      code: `CA-${Date.now()}`,
      name: 'Efectivo',
      requiresReference: false,
      requiresProof: false,
      isCash: true,
      isOnline: false,
      isActive: true,
    })

    const response = await client.post('/admin/hotels/payments').withGuard('web').loginAs(admin).form({
      reservationId: String(reservation.id),
      paymentMethodId: String(cashMethod.id),
      paymentCategory: 'LODGING',
      status: 'PENDING',
      currencyCode: 'USD',
      amount: '75',
    })

    response.assertStatus(400)
    response.assertBodyContains({ message: 'Los pagos en efectivo requieren turno de caja' })
  })

  test('approving payment updates reservation amountPaid and balanceDue', async ({ client, assert }) => {
    const admin = await User.create({
      fullName: 'Phase3 Sync Admin',
      email: `phase3.sync.${Date.now()}@afe.local`,
      password: 'Secret12345',
    })

    await grantPermissionToUser(admin, 'admin.access')
    const { reservation } = await seedReservationBase(admin)

    const method = await PaymentMethod.create({
      code: `PM-${Date.now()}`,
      name: 'Manual',
      requiresReference: false,
      requiresProof: false,
      isCash: false,
      isOnline: true,
      isActive: true,
    })

    const createResponse = await client.post('/admin/hotels/payments').withGuard('web').loginAs(admin).form({
      reservationId: String(reservation.id),
      paymentMethodId: String(method.id),
      paymentCategory: 'LODGING',
      status: 'PENDING',
      currencyCode: 'USD',
      amount: '50',
      referenceNumber: `REF-${Date.now()}`,
    })

    createResponse.assertStatus(201)

    const payment = await Payment.query().where('reservation_id', reservation.id).orderBy('id', 'desc').firstOrFail()

    const updateResponse = await client
      .post(`/admin/hotels/payments/${payment.id}/update`)
      .withGuard('web')
      .loginAs(admin)
      .form({
        paymentNumber: payment.paymentNumber,
        reservationId: String(reservation.id),
        paymentMethodId: String(method.id),
        paymentCategory: 'LODGING',
        status: 'APPROVED',
        currencyCode: 'USD',
        amount: '50',
        referenceNumber: `REF-${Date.now()}`,
      })

    updateResponse.assertStatus(200)

    await reservation.refresh()
    assert.equal(Number(reservation.amountPaid), 50)
    assert.equal(Number(reservation.balanceDue), 150)
  })

  test('rejects duplicate payment reservation allocation pair', async ({ client }) => {
    const admin = await User.create({
      fullName: 'Phase3 Allocation Admin',
      email: `phase3.alloc.${Date.now()}@afe.local`,
      password: 'Secret12345',
    })

    await grantPermissionToUser(admin, 'admin.access')
    const { reservation } = await seedReservationBase(admin)

    const method = await PaymentMethod.create({
      code: `PA-${Date.now()}`,
      name: 'Pago Alloc',
      requiresReference: false,
      requiresProof: false,
      isCash: false,
      isOnline: true,
      isActive: true,
    })

    const payment = await Payment.create({
      paymentNumber: `PAY-F3-${Date.now()}`,
      reservationId: reservation.id,
      paymentMethodId: method.id,
      paymentCategory: 'MIXED',
      status: 'PENDING',
      currencyCode: 'USD',
      amount: 100,
      recordedByUserId: admin.id,
    })

    const first = await client
      .post('/admin/hotels/payment-reservation-allocations')
      .withGuard('web')
      .loginAs(admin)
      .form({ paymentId: String(payment.id), reservationId: String(reservation.id), amount: '70' })

    first.assertStatus(201)

    const second = await client
      .post('/admin/hotels/payment-reservation-allocations')
      .withGuard('web')
      .loginAs(admin)
      .form({ paymentId: String(payment.id), reservationId: String(reservation.id), amount: '10' })

    second.assertStatus(409)
    second.assertBodyContains({ message: 'La asignacion para pago/reservacion ya existe' })
  })

  test('creates proof, transaction and charge allocation successfully', async ({ client }) => {
    const admin = await User.create({
      fullName: 'Phase3 Modules Admin',
      email: `phase3.modules.${Date.now()}@afe.local`,
      password: 'Secret12345',
    })

    await grantPermissionToUser(admin, 'admin.access')
    const { reservation } = await seedReservationBase(admin)

    const method = await PaymentMethod.create({
      code: `MO-${Date.now()}`,
      name: 'Manual Ops',
      requiresReference: false,
      requiresProof: false,
      isCash: false,
      isOnline: true,
      isActive: true,
    })

    const payment = await Payment.create({
      paymentNumber: `PAY-F3-M-${Date.now()}`,
      reservationId: reservation.id,
      paymentMethodId: method.id,
      paymentCategory: 'MIXED',
      status: 'PENDING',
      currencyCode: 'USD',
      amount: 150,
      recordedByUserId: admin.id,
    })

    const charge = await ReservationCharge.create({
      reservationId: reservation.id,
      chargeCatalogId: null,
      chargeKind: 'SERVICE',
      chargeStatus: 'PENDING',
      concept: 'Mini bar',
      quantity: 1,
      unitPrice: 10,
      subtotal: 10,
      ivaTotal: 0,
      tourismTaxTotal: 0,
      totalAmount: 10,
      addedByUserId: admin.id,
      voidedByUserId: null,
      voidReason: null,
      consumedAt: DateTime.now(),
    })

    const proofResponse = await client.post('/admin/hotels/payment-proofs').withGuard('web').loginAs(admin).form({
      paymentId: String(payment.id),
      filePath: '/tmp/proof-1.png',
      originalName: 'proof-1.png',
      mimeType: 'image/png',
      fileSizeBytes: '2048',
      validationStatus: 'PENDING',
    })

    proofResponse.assertStatus(201)

    const txResponse = await client
      .post('/admin/hotels/payment-transactions')
      .withGuard('web')
      .loginAs(admin)
      .form({
        paymentId: String(payment.id),
        provider: 'BANK',
        externalTransactionId: `TX-${Date.now()}`,
        transactionStatus: 'REPORTED',
      })

    txResponse.assertStatus(201)

    const allocResponse = await client
      .post('/admin/hotels/payment-charge-allocations')
      .withGuard('web')
      .loginAs(admin)
      .form({
        paymentId: String(payment.id),
        reservationChargeId: String(charge.id),
        amount: '10',
      })

    allocResponse.assertStatus(201)
  })
})
