import type { HttpContext } from '@adonisjs/core/http'
import Role from '#models/role'

export default class RolesController {
  async index({ view }: HttpContext) {
    const roles = await Role.query().preload('permissions').orderBy('id', 'asc')

    return view.render('pages/admin/roles', {
      roles,
    })
  }
}
