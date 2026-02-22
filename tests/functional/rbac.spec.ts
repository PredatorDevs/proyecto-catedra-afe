import User from '#models/user'
import Role from '#models/role'
import Permission from '#models/permission'
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

test.group('RBAC route protection', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('denies access to admin users route without permission', async ({ client }) => {
    const user = await User.create({
      fullName: 'No Permission User',
      email: `noperm.${Date.now()}@afe.local`,
      password: 'Secret12345',
    })

    const response = await client.get('/admin/users').withGuard('web').loginAs(user)

    response.assertStatus(403)
  })

  test('allows access to admin users route with users.read permission', async ({ client }) => {
    const user = await User.create({
      fullName: 'Permitted User',
      email: `perm.${Date.now()}@afe.local`,
      password: 'Secret12345',
    })

    await grantPermissionToUser(user, 'users.read')

    const response = await client.get('/admin/users').withGuard('web').loginAs(user)

    response.assertStatus(200)
    response.assertTextIncludes('Usuarios')
  })
})
