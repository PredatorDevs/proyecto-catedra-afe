import User from '#models/user'
import Role from '#models/role'
import Permission from '#models/permission'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

export default class extends BaseSeeder {
  async run() {
    const permissions = [
      { slug: 'admin.access', name: 'Acceso al panel admin' },
      { slug: 'users.read', name: 'Ver usuarios' },
      { slug: 'users.manage', name: 'Gestionar usuarios' },
      { slug: 'roles.read', name: 'Ver roles' },
      { slug: 'roles.manage', name: 'Gestionar roles' },
      { slug: 'permissions.read', name: 'Ver permisos' },
      { slug: 'permissions.manage', name: 'Gestionar permisos' },
    ]

    for (const permission of permissions) {
      await Permission.updateOrCreate({ slug: permission.slug }, permission)
    }

    const adminRole = await Role.updateOrCreate(
      { slug: 'admin' },
      { slug: 'admin', name: 'Administrador' }
    )

    const userRole = await Role.updateOrCreate({ slug: 'user' }, { slug: 'user', name: 'Usuario' })

    const allPermissions = await Permission.all()
    await adminRole.related('permissions').sync(allPermissions.map((permission) => permission.id))

    const userPermissions = await Permission.query().whereIn('slug', ['users.read'])
    await userRole.related('permissions').sync(userPermissions.map((permission) => permission.id))

    const adminUser = await User.updateOrCreate(
      { email: 'admin@afe.local' },
      {
        fullName: 'Administrador Inicial',
        email: 'admin@afe.local',
        password: 'Admin12345',
      }
    )

    const standardUser = await User.updateOrCreate(
      { email: 'user@afe.local' },
      {
        fullName: 'Usuario Inicial',
        email: 'user@afe.local',
        password: 'User12345',
      }
    )

    await adminUser.related('roles').sync([adminRole.id])
    await standardUser.related('roles').sync([userRole.id])
  }
}
