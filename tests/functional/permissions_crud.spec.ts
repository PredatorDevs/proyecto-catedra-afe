import User from '#models/user'
import Role from '#models/role'
import Permission from '#models/permission'
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

test.group('Permissions CRUD', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('denies permission creation without permissions.manage', async ({ client }) => {
    const user = await User.create({
      fullName: 'No Permission Manage',
      email: `nopermmanage.${Date.now()}@afe.local`,
      password: 'Secret12345',
    })

    const response = await client.post('/admin/permissions').withGuard('web').loginAs(user).form({
      slug: `inventory.read.${Date.now()}`,
      name: 'Inventory Read',
    })

    response.assertStatus(403)
  })

  test('allows permission creation with permissions.manage and logs audit', async ({ client, assert }) => {
    const user = await User.create({
      fullName: 'Permission Manager',
      email: `permmanager.${Date.now()}@afe.local`,
      password: 'Secret12345',
    })

    await grantPermissionToUser(user, 'permissions.manage')

    const slug = `inventory.read.${Date.now()}`

    const response = await client.post('/admin/permissions').withGuard('web').loginAs(user).form({
      slug,
      name: 'Inventory Read',
    })

    response.assertRedirectsTo('/admin/permissions')

    const createdPermission = await Permission.findBy('slug', slug)
    assert.exists(createdPermission)

    const audit = await AuditLog.query()
      .where('action', 'CREATE')
      .andWhere('entity', 'permission')
      .andWhere('entity_id', String(createdPermission!.id))
      .first()

    assert.exists(audit)
  })
})
