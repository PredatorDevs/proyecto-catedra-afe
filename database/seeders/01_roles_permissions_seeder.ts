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
      { slug: 'audit_logs.read', name: 'Ver bitácora' },
      { slug: 'audit_logs.manage', name: 'Gestionar bitácora' },
    ]

    for (const permission of permissions) {
      await Permission.updateOrCreate({ slug: permission.slug }, permission)
    }

    await Role.updateOrCreate({ slug: 'admin' }, { slug: 'admin', name: 'Administrador' })
    await Role.updateOrCreate({ slug: 'user' }, { slug: 'user', name: 'Usuario' })
  }
}
