import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import Role from '#models/role'
import AuditLogger from '#services/audit_logger'
import { createUserValidator } from '#validators/admin/create_user_validator'

export default class UsersController {
  async index({ view }: HttpContext) {
    const users = await User.query().preload('roles').orderBy('id', 'asc')
    const roles = await Role.query().orderBy('slug', 'asc')

    return view.render('pages/admin/users', {
      users,
      roles,
    })
  }

  async store(ctx: HttpContext) {
    const { request, response, session } = ctx
    const payload = await request.validateUsing(createUserValidator)

    const user = await User.create({
      fullName: payload.fullName,
      email: payload.email,
      password: payload.password,
    })

    const rawRoleIds = request.input('roleIds')
    const selectedRoleIds = Array.isArray(rawRoleIds)
      ? rawRoleIds
      : rawRoleIds
        ? [rawRoleIds]
        : []

    const roleIds = selectedRoleIds
      .map((value) => Number(value))
      .filter((value) => Number.isInteger(value) && value > 0)

    if (roleIds.length) {
      await user.related('roles').sync(roleIds)
    }

    await AuditLogger.log(
      {
        action: 'CREATE',
        entity: 'user',
        entityId: user.id,
        metadata: {
          source: 'admin.users.store',
          roleIds,
        },
      },
      ctx
    )

    session.flash('success', 'Usuario creado correctamente')
    return response.redirect('/admin/users')
  }
}
