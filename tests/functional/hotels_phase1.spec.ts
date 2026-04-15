import User from '#models/user'
import Role from '#models/role'
import Permission from '#models/permission'
import Customer from '#models/customer'
import RoomType from '#models/room_type'
import AuditLog from '#models/audit_log'
import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'

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

test.group('Hotels Phase 1 endpoints', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('denies customer creation without admin.access', async ({ client }) => {
    const user = await User.create({
      fullName: 'No Hotels Access',
      email: `hotels.noaccess.${Date.now()}@afe.local`,
      password: 'Secret12345',
    })

    const response = await client.post('/admin/hotels/customers').withGuard('web').loginAs(user).form({
      customerType: 'INDIVIDUAL',
      fullName: 'Cliente Bloqueado',
      email: `blocked.${Date.now()}@afe.local`,
    })

    response.assertStatus(403)
  })

  test('creates customer with admin.access and writes audit log', async ({ client, assert }) => {
    const user = await User.create({
      fullName: 'Hotels Admin',
      email: `hotels.admin.${Date.now()}@afe.local`,
      password: 'Secret12345',
    })

    await grantPermissionToUser(user, 'admin.access')

    const code = `CUST-${Date.now()}`

    const response = await client.post('/admin/hotels/customers').withGuard('web').loginAs(user).form({
      customerCode: code,
      customerType: 'INDIVIDUAL',
      fullName: 'Cliente Hotel Prueba',
      email: `cliente.${Date.now()}@afe.local`,
    })

    response.assertStatus(201)

    const created = await Customer.findBy('customerCode', code)
    assert.exists(created)

    const audit = await AuditLog.query()
      .where('action', 'CREATE')
      .andWhere('entity', 'customer')
      .andWhere('entity_id', String(created!.id))
      .first()

    assert.exists(audit)
  })

  test('rejects overlapping active room prices for same room type scope', async ({ client }) => {
    const user = await User.create({
      fullName: 'Hotels Price Admin',
      email: `hotels.prices.${Date.now()}@afe.local`,
      password: 'Secret12345',
    })

    await grantPermissionToUser(user, 'admin.access')

    const roomType = await RoomType.create({
      code: `STD-${Date.now()}`,
      name: 'Standard',
      description: null,
      baseCapacity: 2,
      maxCapacity: 3,
      bedType: 'QUEEN',
      bedCount: 1,
      hasPrivateBathroom: true,
      defaultNightlyPrice: 50,
      isActive: true,
      createdByUserId: user.id,
      updatedByUserId: user.id,
    })

    const firstResponse = await client
      .post('/admin/hotels/room-prices')
      .withGuard('web')
      .loginAs(user)
      .form({
        roomTypeId: String(roomType.id),
        name: 'Tarifa Base Enero',
        pricingScope: 'ROOM_TYPE',
        priceBasis: 'NIGHT',
        validFrom: '2026-01-01',
        validTo: '2026-01-31',
        daysOfWeekMask: '1111111',
        basePrice: '70',
      })

    firstResponse.assertStatus(201)

    const overlapResponse = await client
      .post('/admin/hotels/room-prices')
      .withGuard('web')
      .loginAs(user)
      .form({
        roomTypeId: String(roomType.id),
        name: 'Tarifa Solapada',
        pricingScope: 'ROOM_TYPE',
        priceBasis: 'NIGHT',
        validFrom: '2026-01-15',
        validTo: '2026-02-15',
        daysOfWeekMask: '1111111',
        basePrice: '75',
      })

    overlapResponse.assertStatus(400)
    overlapResponse.assertBodyContains({
      message:
        'Ya existe una tarifa activa que se solapa en vigencias para la misma combinacion de roomType/pricingScope/roomId',
    })
  })
})
