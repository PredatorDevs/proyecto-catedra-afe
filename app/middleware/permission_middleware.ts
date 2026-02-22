import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class PermissionMiddleware {
  async handle(
    ctx: HttpContext,
    next: NextFn,
    options: {
      permissions?: string[]
    } = {}
  ) {
    const user = ctx.auth.user

    if (!user) {
      return ctx.response.redirect('/login')
    }

    const requiredPermissions = options.permissions || []

    if (requiredPermissions.length === 0) {
      return next()
    }

    for (const permissionSlug of requiredPermissions) {
      const allowed = await user.can(permissionSlug)
      if (!allowed) {
        return ctx.response.forbidden({
          message: `No tienes permiso para realizar esta acción (${permissionSlug})`,
        })
      }
    }

    return next()
  }
}
