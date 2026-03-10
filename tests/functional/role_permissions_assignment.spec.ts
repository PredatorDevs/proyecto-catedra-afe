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

test.group('Role-Permission assignment', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('denies assignment screen without roles.manage permission', async ({ client }) => {
    const user = await User.create({
      fullName: 'No Role Permission Manager',
      email: `norp.${Date.now()}@afe.local`,
      password: 'Secret12345',
    })

    const roleSlug = `ops-${Date.now()}`
    const role = await Role.updateOrCreate({ slug: roleSlug }, { slug: roleSlug, name: 'Operations' })

    const response = await client.get(`/admin/roles/${role.id}/permissions`).withGuard('web').loginAs(user)

    response.assertStatus(403)
  })

  test('updates role permissions with roles.manage and writes audit log', async ({ client, assert }) => {
    const user = await User.create({
      fullName: 'Role Permission Manager',
      email: `rpm.${Date.now()}@afe.local`,
      password: 'Secret12345',
    })

    await grantPermissionToUser(user, 'roles.manage')

    const roleSlug = `ops-${Date.now()}`
    const role = await Role.updateOrCreate({ slug: roleSlug }, { slug: roleSlug, name: 'Operations' })

    const p1Slug = `inventory.read.${Date.now()}`
    const p2Slug = `inventory.manage.${Date.now()}`
    const p1 = await Permission.updateOrCreate({ slug: p1Slug }, { slug: p1Slug, name: 'Inventory Read' })
    const p2 = await Permission.updateOrCreate({ slug: p2Slug }, { slug: p2Slug, name: 'Inventory Manage' })

    const response = await client
      .post(`/admin/roles/${role.id}/permissions`)
      .withGuard('web')
      .loginAs(user)
      .form({ permissionIds: [String(p1.id), String(p2.id)] })

    response.assertRedirectsTo(`/admin/roles/${role.id}/permissions`)

    await role.load('permissions')
    const assignedIds = role.permissions.map((permission) => permission.id).sort((a, b) => a - b)
    assert.deepEqual(assignedIds, [p1.id, p2.id].sort((a, b) => a - b))

    const audit = await AuditLog.query()
      .where('action', 'UPDATE')
      .andWhere('entity', 'role_permissions')
      .andWhere('entity_id', String(role.id))
      .first()

    assert.exists(audit)
  })
})
