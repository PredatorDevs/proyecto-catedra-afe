import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import { loginValidator } from '#validators/auth/login_validator'
import AuditLogger from '#services/audit_logger'

export default class AuthController {
  async showLogin({ view }: HttpContext) {
    return view.render('pages/auth/login')
  }

  async login(ctx: HttpContext) {
    const { request, response, auth, session } = ctx
    const { email, password } = await request.validateUsing(loginValidator)

    try {
      const user = await User.verifyCredentials(email, password)
      await auth.use('web').login(user)

      await AuditLogger.log(
        {
          action: 'LOGIN',
          entity: 'auth',
          userId: user.id,
          newValues: { email },
          metadata: { email },
        },
        ctx
      )

      return response.redirect('/dashboard')
    } catch {
      await AuditLogger.log(
        {
          action: 'LOGIN_FAILED',
          entity: 'auth',
          newValues: { email },
          metadata: { email },
        },
        ctx
      )

      session.flash('error', 'Credenciales inválidas')
      session.flashAll()
      return response.redirect().back()
    }
  }

  async logout(ctx: HttpContext) {
    const { response, auth } = ctx
    const userId = auth.user?.id ?? null

    await AuditLogger.log(
      {
        action: 'LOGOUT',
        entity: 'auth',
        userId,
        newValues: { userId },
      },
      ctx
    )

    await auth.use('web').logout()
    return response.redirect('/login')
  }
}