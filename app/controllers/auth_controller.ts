import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import { loginValidator } from '#validators/auth/login_validator'
import { registerValidator } from '#validators/auth/register_validator'
import AuditLogger from '#services/audit_logger'

export default class AuthController {
  async showLogin({ view }: HttpContext) {
    return view.render('pages/auth/login')
  }

  async showRegister({ view }: HttpContext) {
    return view.render('pages/auth/register')
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
          metadata: { email },
        },
        ctx
      )

      session.flash('error', 'Credenciales inválidas')
      return response.redirect().back()
    }
  }

  async register(ctx: HttpContext) {
    const { request, response, auth, session } = ctx
    const { email, password } = await request.validateUsing(registerValidator)

    const user = await User.create({ email, password })

    await AuditLogger.log(
      {
        action: 'CREATE',
        entity: 'user',
        entityId: user.id,
        userId: user.id,
        metadata: { source: 'register' },
      },
      ctx
    )

    await auth.use('web').login(user)

    await AuditLogger.log(
      {
        action: 'LOGIN',
        entity: 'auth',
        userId: user.id,
        metadata: { email },
      },
      ctx
    )

    session.flash('success', 'Cuenta creada correctamente')
    return response.redirect('/dashboard')
  }

  async logout(ctx: HttpContext) {
    const { response, auth } = ctx
    const userId = auth.user?.id ?? null

    await AuditLogger.log(
      {
        action: 'LOGOUT',
        entity: 'auth',
        userId,
      },
      ctx
    )

    await auth.use('web').logout()
    return response.redirect('/login')
  }
}