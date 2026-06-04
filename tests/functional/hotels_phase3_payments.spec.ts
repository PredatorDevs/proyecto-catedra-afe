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
import FiscalDocument from '#models/fiscal_document'
import FiscalDocumentItem from '#models/fiscal_document_item'
import FiscalDocumentPayment from '#models/fiscal_document_payment'
import CheckinCheckoutLog from '#models/checkin_checkout_log'
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

async function seedReservationBase(
  admin: User,
  options?: { customerType?: 'INDIVIDUAL' | 'COMPANY'; withFiscalProfile?: boolean }
) {
  const customerType = options?.customerType ?? 'INDIVIDUAL'
  const withFiscalProfile = options?.withFiscalProfile ?? false

  const customer = await Customer.create({
    customerType,
    fullName: `Cliente F3 ${Date.now()}`,
    email: `phase3.customer.${Date.now()}@afe.local`,
    taxName: withFiscalProfile ? `Razon Social ${Date.now()}` : null,
    taxNit: withFiscalProfile ? `0614${Date.now()}`.slice(0, 14) : null,
    taxNrc: withFiscalProfile ? `NRC-${Date.now()}`.slice(0, 20) : null,
    taxAddress: withFiscalProfile ? 'San Salvador, El Salvador' : null,
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

  test('quick reservation transitions create check-in and check-out logs', async ({ client, assert }) => {
    const admin = await User.create({
      fullName: 'Phase3 Quick Transition Admin',
      email: `phase3.quick.transition.${Date.now()}@afe.local`,
      password: 'Secret12345',
    })

    await grantPermissionToUser(admin, 'admin.access')
    const { reservation } = await seedReservationBase(admin)

    const checkInResponse = await client
      .post(`/admin/hotels/reservations/${reservation.id}/transition`)
      .withGuard('web')
      .loginAs(admin)
      .form({ action: 'CHECK_IN' })

    checkInResponse.assertStatus(200)

    await reservation.refresh()
    assert.equal(reservation.status, 'CHECKED_IN')
    assert.isNotNull(reservation.checkedInAt)

    const checkInLog = await CheckinCheckoutLog.query()
      .where('reservation_id', reservation.id)
      .where('action', 'CHECK_IN')
      .first()

    assert.isNotNull(checkInLog)

    const checkOutResponse = await client
      .post(`/admin/hotels/reservations/${reservation.id}/transition`)
      .withGuard('web')
      .loginAs(admin)
      .form({ action: 'CHECK_OUT' })

    checkOutResponse.assertStatus(200)

    await reservation.refresh()
    assert.equal(reservation.status, 'CHECKED_OUT')
    assert.isNotNull(reservation.checkedOutAt)

    const checkOutLog = await CheckinCheckoutLog.query()
      .where('reservation_id', reservation.id)
      .where('action', 'CHECK_OUT')
      .first()

    assert.isNotNull(checkOutLog)
  })

  test('allows cash payment without selecting cashier shift manually', async ({ client, assert }) => {
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
      currencyCode: 'USD',
      amount: '200',
    })

    response.assertStatus(201)

    const payment = await Payment.query().where('reservation_id', reservation.id).orderBy('id', 'desc').firstOrFail()
    assert.isNull(payment.cashierShiftId)
    assert.equal(payment.status, 'APPROVED')
  })

  test('creating payment auto-approves full balance and updates reservation balances', async ({ client, assert }) => {
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
      currencyCode: 'USD',
      amount: '200',
      referenceNumber: `REF-${Date.now()}`,
    })

    createResponse.assertStatus(201)

    await reservation.refresh()
    assert.equal(Number(reservation.amountPaid), 200)
    assert.equal(Number(reservation.balanceDue), 0)
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

  test('generates one fiscal document at checkout from approved payments', async ({ client, assert }) => {
    const admin = await User.create({
      fullName: 'Phase3 Fiscal Admin',
      email: `phase3.fiscal.${Date.now()}@afe.local`,
      password: 'Secret12345',
    })

    await grantPermissionToUser(admin, 'admin.access')
    const { reservation } = await seedReservationBase(admin)

    reservation.status = 'CHECKED_OUT'
    reservation.checkedInAt = DateTime.fromISO('2026-12-01')
    reservation.checkedOutAt = DateTime.fromISO('2026-12-03')
    await reservation.save()

    const method = await PaymentMethod.create({
      code: `FG-${Date.now()}`,
      name: 'Fiscal Gen',
      requiresReference: false,
      requiresProof: false,
      isCash: false,
      isOnline: true,
      isActive: true,
    })

    await Payment.create({
      paymentNumber: `PAY-F3-F1-${Date.now()}`,
      reservationId: reservation.id,
      paymentMethodId: method.id,
      paymentCategory: 'MIXED',
      status: 'APPROVED',
      currencyCode: 'USD',
      amount: 120,
      recordedByUserId: admin.id,
    })

    await Payment.create({
      paymentNumber: `PAY-F3-F2-${Date.now()}`,
      reservationId: reservation.id,
      paymentMethodId: method.id,
      paymentCategory: 'MIXED',
      status: 'APPROVED',
      currencyCode: 'USD',
      amount: 90,
      recordedByUserId: admin.id,
    })

    const charge = await ReservationCharge.create({
      reservationId: reservation.id,
      chargeCatalogId: null,
      chargeKind: 'SERVICE',
      chargeStatus: 'PENDING',
      concept: 'Late checkout',
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

    const response = await client
      .post('/admin/hotels/fiscal-documents/generate-from-reservation')
      .withGuard('web')
      .loginAs(admin)
      .form({
        reservationId: String(reservation.id),
        documentType: 'CONSUMER_FINAL',
        currencyCode: 'USD',
      })

    response.assertStatus(201)

    const document = await FiscalDocument.query().where('reservation_id', reservation.id).firstOrFail()
    assert.equal(document.status, 'ISSUED')
    assert.equal(document.documentType, 'CONSUMER_FINAL')
    assert.equal(Number(document.totalAmount), 210)

    const items = await FiscalDocumentItem.query().where('fiscal_document_id', document.id)
    const payments = await FiscalDocumentPayment.query().where('fiscal_document_id', document.id)

    assert.equal(items.length, 2)
    assert.equal(payments.length, 2)
    assert.equal(
      payments.reduce((acc, item) => acc + Number(item.amount), 0),
      210
    )

    await charge.refresh()
    assert.equal(charge.chargeStatus, 'BILLED')
  })

  test('rejects duplicate active fiscal document generation for same reservation', async ({ client }) => {
    const admin = await User.create({
      fullName: 'Phase3 Fiscal Dup Admin',
      email: `phase3.fiscal.dup.${Date.now()}@afe.local`,
      password: 'Secret12345',
    })

    await grantPermissionToUser(admin, 'admin.access')
    const { reservation } = await seedReservationBase(admin)

    reservation.status = 'CHECKED_OUT'
    await reservation.save()

    const method = await PaymentMethod.create({
      code: `FD-${Date.now()}`,
      name: 'Fiscal Dup',
      requiresReference: false,
      requiresProof: false,
      isCash: false,
      isOnline: true,
      isActive: true,
    })

    await Payment.create({
      paymentNumber: `PAY-F3-DUP-${Date.now()}`,
      reservationId: reservation.id,
      paymentMethodId: method.id,
      paymentCategory: 'LODGING',
      status: 'APPROVED',
      currencyCode: 'USD',
      amount: 200,
      recordedByUserId: admin.id,
    })

    const first = await client
      .post('/admin/hotels/fiscal-documents/generate-from-reservation')
      .withGuard('web')
      .loginAs(admin)
      .form({ reservationId: String(reservation.id), documentType: 'CONSUMER_FINAL' })

    first.assertStatus(201)

    const second = await client
      .post('/admin/hotels/fiscal-documents/generate-from-reservation')
      .withGuard('web')
      .loginAs(admin)
      .form({ reservationId: String(reservation.id), documentType: 'CONSUMER_FINAL' })

    second.assertStatus(409)
    second.assertBodyContains({ message: 'La reservacion ya tiene un documento fiscal activo' })
  })

  test('requires customer tax profile for CREDITO_FISCAL generation', async ({ client }) => {
    const admin = await User.create({
      fullName: 'Phase3 CCF Admin',
      email: `phase3.ccf.${Date.now()}@afe.local`,
      password: 'Secret12345',
    })

    await grantPermissionToUser(admin, 'admin.access')
    const { reservation } = await seedReservationBase(admin, {
      customerType: 'COMPANY',
      withFiscalProfile: false,
    })

    reservation.status = 'CHECKED_OUT'
    await reservation.save()

    const method = await PaymentMethod.create({
      code: `CCF-${Date.now()}`,
      name: 'Fiscal CCF',
      requiresReference: false,
      requiresProof: false,
      isCash: false,
      isOnline: true,
      isActive: true,
    })

    await Payment.create({
      paymentNumber: `PAY-F3-CCF-${Date.now()}`,
      reservationId: reservation.id,
      paymentMethodId: method.id,
      paymentCategory: 'LODGING',
      status: 'APPROVED',
      currencyCode: 'USD',
      amount: 200,
      recordedByUserId: admin.id,
    })

    const response = await client
      .post('/admin/hotels/fiscal-documents/generate-from-reservation')
      .withGuard('web')
      .loginAs(admin)
      .form({ reservationId: String(reservation.id), documentType: 'CREDITO_FISCAL' })

    response.assertStatus(400)
    response.assertBodyContains({
      message: 'Para CREDITO_FISCAL el cliente debe tener nombre fiscal, NIT, NRC y direccion fiscal',
    })
  })

  test('rejects CREDITO_FISCAL for individual customer', async ({ client }) => {
    const admin = await User.create({
      fullName: 'Phase4 Individual CCF Admin',
      email: `phase4.individual.ccf.${Date.now()}@afe.local`,
      password: 'Secret12345',
    })

    await grantPermissionToUser(admin, 'admin.access')
    const { reservation } = await seedReservationBase(admin, {
      customerType: 'INDIVIDUAL',
      withFiscalProfile: false,
    })

    reservation.status = 'CHECKED_OUT'
    await reservation.save()

    const method = await PaymentMethod.create({
      code: `I-CCF-${Date.now()}`,
      name: 'Individual CCF',
      requiresReference: false,
      requiresProof: false,
      isCash: false,
      isOnline: true,
      isActive: true,
    })

    await Payment.create({
      paymentNumber: `PAY-F4-I-CCF-${Date.now()}`,
      reservationId: reservation.id,
      paymentMethodId: method.id,
      paymentCategory: 'LODGING',
      status: 'APPROVED',
      currencyCode: 'USD',
      amount: 200,
      recordedByUserId: admin.id,
    })

    const response = await client
      .post('/admin/hotels/fiscal-documents/generate-from-reservation')
      .withGuard('web')
      .loginAs(admin)
      .form({ reservationId: String(reservation.id), documentType: 'CREDITO_FISCAL' })

    response.assertStatus(400)
    response.assertBodyContains({
      message: 'CREDITO_FISCAL solo puede emitirse para clientes de tipo empresa',
    })
  })

  test('allows CREDITO_FISCAL for company customer with fiscal profile', async ({ client, assert }) => {
    const admin = await User.create({
      fullName: 'Phase4 Company CCF Admin',
      email: `phase4.company.ccf.${Date.now()}@afe.local`,
      password: 'Secret12345',
    })

    await grantPermissionToUser(admin, 'admin.access')
    const { reservation } = await seedReservationBase(admin, {
      customerType: 'COMPANY',
      withFiscalProfile: true,
    })

    reservation.status = 'CHECKED_OUT'
    await reservation.save()

    const method = await PaymentMethod.create({
      code: `C-CCF-${Date.now()}`,
      name: 'Company CCF',
      requiresReference: false,
      requiresProof: false,
      isCash: false,
      isOnline: true,
      isActive: true,
    })

    await Payment.create({
      paymentNumber: `PAY-F4-C-CCF-${Date.now()}`,
      reservationId: reservation.id,
      paymentMethodId: method.id,
      paymentCategory: 'LODGING',
      status: 'APPROVED',
      currencyCode: 'USD',
      amount: 200,
      recordedByUserId: admin.id,
    })

    const response = await client
      .post('/admin/hotels/fiscal-documents/generate-from-reservation')
      .withGuard('web')
      .loginAs(admin)
      .form({ reservationId: String(reservation.id), documentType: 'CREDITO_FISCAL' })

    response.assertStatus(201)

    const document = await FiscalDocument.query().where('reservation_id', reservation.id).firstOrFail()
    assert.equal(document.documentType, 'CREDITO_FISCAL')
    assert.equal(document.status, 'ISSUED')
  })

  test('auto checkout and fiscal generation from checked-in reservation', async ({ client, assert }) => {
    const admin = await User.create({
      fullName: 'Phase3 Auto Checkout Admin',
      email: `phase3.auto.checkout.${Date.now()}@afe.local`,
      password: 'Secret12345',
    })

    await grantPermissionToUser(admin, 'admin.access')
    const { reservation, room } = await seedReservationBase(admin)

    reservation.status = 'CHECKED_IN'
    reservation.checkedInAt = DateTime.fromISO('2026-12-01')
    await reservation.save()

    room.currentStatus = 'OCCUPIED'
    await room.save()

    const method = await PaymentMethod.create({
      code: `AC-${Date.now()}`,
      name: 'Auto Checkout Fiscal',
      requiresReference: false,
      requiresProof: false,
      isCash: false,
      isOnline: true,
      isActive: true,
    })

    await Payment.create({
      paymentNumber: `PAY-F3-AC-${Date.now()}`,
      reservationId: reservation.id,
      paymentMethodId: method.id,
      paymentCategory: 'LODGING',
      status: 'APPROVED',
      currencyCode: 'USD',
      amount: 200,
      recordedByUserId: admin.id,
    })

    const response = await client
      .post('/admin/hotels/fiscal-documents/generate-from-reservation')
      .withGuard('web')
      .loginAs(admin)
      .form({
        reservationId: String(reservation.id),
        documentType: 'CONSUMER_FINAL',
        autoCheckout: 'true',
      })

    response.assertStatus(201)

    await reservation.refresh()
    await room.refresh()

    assert.equal(reservation.status, 'CHECKED_OUT')
    assert.isNotNull(reservation.checkedOutAt)
    assert.equal(room.currentStatus, 'DIRTY')

    const checkoutLog = await CheckinCheckoutLog.query()
      .where('reservation_id', reservation.id)
      .where('action', 'CHECK_OUT')
      .first()

    assert.isNotNull(checkoutLog)
  })
})
