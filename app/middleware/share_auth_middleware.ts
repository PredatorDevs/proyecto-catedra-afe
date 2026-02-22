import type { HttpContext } from '@adonisjs/core/http'

export default class ShareAuthMiddleware {
  async handle(ctx: HttpContext, next: () => Promise<void>) {
    // Carga usuario si hay sesión (no lanza error si no hay)
    await ctx.auth.use('web').check()

    // Comparte variables para cualquier vista/partial del request
    ctx.view?.share({
      authUser: ctx.auth.user,
      isAuthenticated: !!ctx.auth.user,
    })

    return next()
  }
}