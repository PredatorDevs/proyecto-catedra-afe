import User from '#models/user'
import AuditLog from '#models/audit_log'
import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'

test.group('Audit logs', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('creates LOGIN audit log on successful login', async ({ client, assert }) => {
    const user = await User.create({
      fullName: 'Audit Login User',
      email: `audit.login.${Date.now()}@afe.local`,
      password: 'Secret12345',
    })

    const response = await client
      .post('/login')
      .form({ email: user.email, password: 'Secret12345' })

    response.assertRedirectsTo('/dashboard')

    const log = await AuditLog.query()
      .where('action', 'LOGIN')
      .andWhere('user_id', user.id)
      .first()

    assert.exists(log)
  })

  test('creates LOGIN_FAILED audit log on invalid credentials', async ({ client, assert }) => {
    const response = await client
      .post('/login')
      .form({ email: `missing.${Date.now()}@afe.local`, password: 'WrongPassword123' })

    response.assertRedirectsTo('/login')

    const log = await AuditLog.query().where('action', 'LOGIN_FAILED').first()
    assert.exists(log)
  })

  test('creates LOGOUT audit log on logout', async ({ client, assert }) => {
    const user = await User.create({
      fullName: 'Audit Logout User',
      email: `audit.logout.${Date.now()}@afe.local`,
      password: 'Secret12345',
    })

    const response = await client.post('/logout').withGuard('web').loginAs(user)

    response.assertRedirectsTo('/login')

    const log = await AuditLog.query()
      .where('action', 'LOGOUT')
      .andWhere('user_id', user.id)
      .first()

    assert.exists(log)
  })
})
