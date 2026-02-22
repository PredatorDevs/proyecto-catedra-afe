import User from '#models/user'
import Role from '#models/role'
import Permission from '#models/permission'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

export default class extends BaseSeeder {
  async run() {
    const adminRole = await Role.findByOrFail('slug', 'admin')
    const userRole = await Role.findByOrFail('slug', 'user')

    const allPermissions = await Permission.all()
    await adminRole.related('permissions').sync(allPermissions.map((permission) => permission.id))

    const userPermissions = await Permission.query().whereIn('slug', ['users.read'])
    await userRole.related('permissions').sync(userPermissions.map((permission) => permission.id))

    const adminUser = await User.findByOrFail('email', 'admin@afe.local')
    const standardUser = await User.findByOrFail('email', 'user@afe.local')

    await adminUser.related('roles').sync([adminRole.id])
    await standardUser.related('roles').sync([userRole.id])
  }
}
