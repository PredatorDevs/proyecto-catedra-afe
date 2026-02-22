import type { HttpContext } from '@adonisjs/core/http'

export default class ShareAuthMiddleware {
  async handle(ctx: HttpContext, next: () => Promise<void>) {
    // Carga usuario si hay sesión (no lanza error si no hay)
    await ctx.auth.use('web').check()

    const authPermissions: string[] = []

    if (ctx.auth.user) {
      const roles = await ctx.auth.user.related('roles').query().preload('permissions')

      for (const role of roles) {
        for (const permission of role.permissions) {
          authPermissions.push(permission.slug)
        }
      }
    }

    const uniquePermissions = Array.from(new Set(authPermissions))

    // Comparte variables para cualquier vista/partial del request
    ctx.view?.share({
      authUser: ctx.auth.user,
      isAuthenticated: !!ctx.auth.user,
      authPermissions: uniquePermissions,
    })

    return next()
  }
}