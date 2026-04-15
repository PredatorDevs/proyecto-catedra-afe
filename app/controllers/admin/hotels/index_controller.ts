import type { HttpContext } from '@adonisjs/core/http'

export default class HotelsIndexController {
  async index({ view }: HttpContext) {
    return view.render('pages/admin/hotels/index')
  }
}
