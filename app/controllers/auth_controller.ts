import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import { loginValidator } from '#validators/auth/login_validator'
import { registerValidator } from '#validators/auth/register_validator'

export default class AuthController {
  async showLogin({ view, auth, response }: HttpContext) {
    if (await auth.use('web').check()) {
        return response.redirect('/dashboard')
    }
    return view.render('pages/auth/login')
    }

    async showRegister({ view, auth, response }: HttpContext) {
    if (await auth.use('web').check()) {
        return response.redirect('/dashboard')
    }
    return view.render('pages/auth/register')
    }

  async login({ request, response, auth, session }: HttpContext) {
    const { email, password } = await request.validateUsing(loginValidator)

    try {
      const user = await User.verifyCredentials(email, password)
      await auth.use('web').login(user)
      return response.redirect('/dashboard')
    } catch {
      session.flash('error', 'Credenciales inválidas')
      return response.redirect().back()
    }
  }

  async register({ request, response, auth, session }: HttpContext) {
    const { email, password } = await request.validateUsing(registerValidator)

    const user = await User.create({ email, password })
    await auth.use('web').login(user)

    session.flash('success', 'Cuenta creada correctamente')
    return response.redirect('/dashboard')
  }

  async logout({ response, auth }: HttpContext) {
    await auth.use('web').logout()
    return response.redirect('/login')
  }
}