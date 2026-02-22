import User from '#models/user'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

export default class extends BaseSeeder {
  async run() {
    await User.updateOrCreate(
      { email: 'admin@afe.local' },
      {
        fullName: 'Administrador Inicial',
        email: 'admin@afe.local',
        password: 'Admin12345',
      }
    )

    await User.updateOrCreate(
      { email: 'user@afe.local' },
      {
        fullName: 'Usuario Inicial',
        email: 'user@afe.local',
        password: 'User12345',
      }
    )
  }
}
