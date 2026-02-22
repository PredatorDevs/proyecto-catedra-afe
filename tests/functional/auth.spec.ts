import User from '#models/user'
import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'

test.group('Auth flows', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('registers a new user and redirects to dashboard', async ({ client, assert }) => {
    const email = `new.user.${Date.now()}@afe.local`

    const response = await client
      .post('/register')
      .form({
        email,
        password: 'Secret12345',
      })

    response.assertRedirectsTo('/dashboard')

    const user = await User.findBy('email', email)
    assert.exists(user)
  })

  test('logs in with valid credentials', async ({ client }) => {
    const user = await User.create({
      fullName: 'Login User',
      email: `login.user.${Date.now()}@afe.local`,
      password: 'Secret12345',
    })

    const response = await client
      .post('/login')
      .form({
        email: user.email,
        password: 'Secret12345',
      })

    response.assertRedirectsTo('/dashboard')
  })

  test('logs out authenticated user', async ({ client }) => {
    const user = await User.create({
      fullName: 'Logout User',
      email: `logout.user.${Date.now()}@afe.local`,
      password: 'Secret12345',
    })

    await client.post('/login').form({
      email: user.email,
      password: 'Secret12345',
    })

    const response = await client.post('/logout')

    response.assertRedirectsTo('/login')
  })
})
