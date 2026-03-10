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

test.group('Roles CRUD', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('denies role creation without roles.manage permission', async ({ client }) => {
    const user = await User.create({
      fullName: 'No Role Manage',
      email: `norolemanage.${Date.now()}@afe.local`,
      password: 'Secret12345',
    })

    const response = await client.post('/admin/roles').withGuard('web').loginAs(user).form({
      slug: `ops-${Date.now()}`,
      name: 'Operations',
    })

    response.assertStatus(403)
  })

  test('allows role creation with roles.manage permission and logs audit', async ({ client, assert }) => {
    const user = await User.create({
      fullName: 'Role Manager',
      email: `rolemanager.${Date.now()}@afe.local`,
      password: 'Secret12345',
    })

    await grantPermissionToUser(user, 'roles.manage')

    const slug = `ops-${Date.now()}`

    const response = await client.post('/admin/roles').withGuard('web').loginAs(user).form({
      slug,
      name: 'Operations',
    })

    response.assertRedirectsTo('/admin/roles')

    const createdRole = await Role.findBy('slug', slug)
    assert.exists(createdRole)

    const audit = await AuditLog.query()
      .where('action', 'CREATE')
      .andWhere('entity', 'role')
      .andWhere('entity_id', String(createdRole!.id))
      .first()

    assert.exists(audit)
  })
})
