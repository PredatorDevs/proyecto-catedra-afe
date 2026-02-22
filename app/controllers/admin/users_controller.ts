import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'

export default class UsersController {
  async index({ view }: HttpContext) {
    const users = await User.query().preload('roles').orderBy('id', 'asc')

    return view.render('pages/admin/users', {
      users,
    })
  }
}
