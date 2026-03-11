import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import Role from '#models/role'
import AuditLogger from '#services/audit_logger'
import { createUserValidator } from '#validators/admin/create_user_validator'

export default class UsersController {
  async index({ view }: HttpContext) {
    const users = await User.query().preload('roles').orderBy('id', 'asc')
    const roles = await Role.query().orderBy('slug', 'asc')
    const userRoleIdsByUserId = Object.fromEntries(
      users.map((user) => [user.id, user.roles.map((role) => role.id)])
    )
    const usersWithRoles = users.filter((user) => user.roles.length > 0).length
    const usersWithoutRoles = users.length - usersWithRoles

    return view.render('pages/admin/users', {
      users,
      roles,
      userRoleIdsByUserId,
      userStats: {
        totalUsers: users.length,
        usersWithRoles,
        usersWithoutRoles,
        totalRoles: roles.length,
      },
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

  async update(ctx: HttpContext) {
    const { params, request, response, session } = ctx
    const user = await User.query().where('id', params.id).preload('roles').firstOrFail()

    const normalizeInput = (value: unknown): string => (typeof value === 'string' ? value.trim() : '')

    const fullName = normalizeInput(request.input('fullName'))
    const email = normalizeInput(request.input('email')).toLowerCase()
    const password = normalizeInput(request.input('password'))

    if (fullName.length < 3 || fullName.length > 120) {
      session.flash('error', 'El nombre completo debe tener entre 3 y 120 caracteres')
      return response.redirect('/admin/users')
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailPattern.test(email)) {
      session.flash('error', 'Debes ingresar un email valido para actualizar el usuario')
      return response.redirect('/admin/users')
    }

    if (password && password.length < 8) {
      session.flash('error', 'Si defines una nueva password, debe tener al menos 8 caracteres')
      return response.redirect('/admin/users')
    }

    const duplicate = await User.query().where('email', email).whereNot('id', user.id).first()
    if (duplicate) {
      session.flash('error', `Ya existe otro usuario con email "${email}"`)
      return response.redirect('/admin/users')
    }

    const rawRoleIds = request.input('roleIds')
    const selectedRoleIds = Array.isArray(rawRoleIds)
      ? rawRoleIds
      : rawRoleIds
        ? [rawRoleIds]
        : []

    const roleIds = selectedRoleIds
      .map((value) => Number(value))
      .filter((value) => Number.isInteger(value) && value > 0)

    const previous = {
      fullName: user.fullName,
      email: user.email,
      roleIds: user.roles.map((role) => role.id),
    }

    user.fullName = fullName
    user.email = email
    if (password) {
      user.password = password
    }
    await user.save()
    await user.related('roles').sync(roleIds)

    await AuditLogger.log(
      {
        action: 'UPDATE',
        entity: 'user',
        entityId: user.id,
        metadata: {
          source: 'admin.users.update',
          previous,
          current: {
            fullName: user.fullName,
            email: user.email,
            roleIds,
          },
          passwordChanged: Boolean(password),
        },
      },
      ctx
    )

    session.flash('success', 'Usuario actualizado correctamente')
    return response.redirect('/admin/users')
  }
}
