import type { HttpContext } from '@adonisjs/core/http'

type FormFieldOption = { value: string | number; label: string }

export type CatalogField = {
  name: string
  label: string
  type?: 'text' | 'number' | 'email' | 'date' | 'textarea' | 'select' | 'checkbox'
  required?: boolean
  fullWidth?: boolean
  colSpanMd?: 1 | 2
  colSpanXl?: 1 | 2 | 3
  min?: number
  max?: number
  step?: string
  rows?: number
  options?: FormFieldOption[]
}

export function prefersHtml(ctx: HttpContext) {
  const acceptHeader = (ctx.request.header('accept') || '').toLowerCase()

  if (acceptHeader.includes('application/json')) {
    return false
  }

  if (acceptHeader.includes('text/html')) {
    return true
  }

  const accepted = ctx.request.accepts(['json', 'html'])
  return accepted === 'html'
}

export function renderCatalogIndex(ctx: HttpContext, payload: Record<string, unknown>) {
  return ctx.view.render('pages/admin/hotels/catalog', payload)
}

export function renderCatalogForm(ctx: HttpContext, payload: Record<string, unknown>) {
  return ctx.view.render('pages/admin/hotels/catalog_form', payload)
}

export function respondConflictOrRedirect(
  ctx: HttpContext,
  message: string,
  redirectTo: string,
  statusCode: 400 | 409 = 409
) {
  if (prefersHtml(ctx)) {
    ctx.session.flash('error', message)
    return ctx.response.redirect(redirectTo)
  }

  if (statusCode === 409) {
    return ctx.response.conflict({ message })
  }

  return ctx.response.badRequest({ message })
}

export function respondSuccessOrJson(
  ctx: HttpContext,
  message: string,
  redirectTo: string,
  data: unknown,
  isCreate = false
) {
  if (prefersHtml(ctx)) {
    ctx.session.flash('success', message)
    return ctx.response.redirect(redirectTo)
  }

  if (isCreate) {
    return ctx.response.created({ message, data })
  }

  return ctx.response.ok({ message, data })
}
