import type { HttpContext } from '@adonisjs/core/http'
import PaymentMethod from '#models/payment_method'
import AuditLogger from '#services/audit_logger'
import { createPaymentMethodValidator } from '#validators/admin/hotels/create_payment_method_validator'
import {
  prefersHtml,
  renderCatalogForm,
  renderCatalogIndex,
  respondConflictOrRedirect,
  respondSuccessOrJson,
  type CatalogField,
} from '#controllers/admin/hotels/ui_support'

export default class PaymentMethodsController {
  private fields(): CatalogField[] {
    return [
      { name: 'code', label: 'Codigo', required: true },
      { name: 'name', label: 'Nombre', required: true, colSpanMd: 2 },
      { name: 'requiresReference', label: 'Requiere referencia', type: 'checkbox' },
      { name: 'requiresProof', label: 'Requiere comprobante', type: 'checkbox' },
      { name: 'isCash', label: 'Es efectivo', type: 'checkbox' },
      { name: 'isOnline', label: 'Es en linea', type: 'checkbox' },
      { name: 'isActive', label: 'Activo', type: 'checkbox' },
    ]
  }

  async index(ctx: HttpContext) {
    const rows = await PaymentMethod.query().orderBy('id', 'desc')

    if (prefersHtml(ctx)) {
      return renderCatalogIndex(ctx, {
        pageKicker: 'Pagos',
        pageTitle: 'Metodos de Pago',
        pageSubtitle: 'Configura metodos manuales y sus requisitos de referencia/comprobante.',
        createHref: '/admin/hotels/payment-methods/new',
        createLabel: 'Nuevo metodo',
        editBaseHref: '/admin/hotels/payment-methods',
        columns: [
          { key: 'code', label: 'Codigo', badge: true },
          { key: 'name', label: 'Nombre' },
          { key: 'flags', label: 'Reglas' },
          { key: 'isActive', label: 'Activo', badge: true },
        ],
        rows: rows.map((row) => ({
          id: row.id,
          code: row.code,
          name: row.name,
          flags: [
            row.requiresReference ? 'Ref' : null,
            row.requiresProof ? 'Comp' : null,
            row.isCash ? 'Efectivo' : null,
            row.isOnline ? 'Online' : null,
          ]
            .filter(Boolean)
            .join(' / ') || '-',
          isActive: row.isActive ? 'Si' : 'No',
        })),
      })
    }

    return ctx.response.ok({ data: rows })
  }

  async create(ctx: HttpContext) {
    return renderCatalogForm(ctx, {
      formMode: 'create',
      formKicker: 'Pagos',
      formTitle: 'Nuevo metodo de pago',
      formSubtitle: 'Define como se registra manualmente un pago en recepcion.',
      formAction: '/admin/hotels/payment-methods',
      submitLabel: 'Crear metodo',
      backHref: '/admin/hotels/payment-methods',
      fields: this.fields(),
      values: { isActive: true },
    })
  }

  async edit(ctx: HttpContext) {
    const row = await PaymentMethod.findOrFail(ctx.params.id)

    return renderCatalogForm(ctx, {
      formMode: 'edit',
      formKicker: 'Pagos',
      formTitle: `Editar metodo #${row.id}`,
      formSubtitle: 'Actualiza requisitos operativos del metodo.',
      formAction: `/admin/hotels/payment-methods/${row.id}/update`,
      submitLabel: 'Guardar cambios',
      backHref: '/admin/hotels/payment-methods',
      fields: this.fields(),
      values: row.serialize(),
    })
  }

  async store(ctx: HttpContext) {
    const payload = await ctx.request.validateUsing(createPaymentMethodValidator)

    const code = payload.code.trim().toUpperCase()
    const exists = await PaymentMethod.query().where('code', code).first()
    if (exists) {
      return respondConflictOrRedirect(ctx, 'Ya existe un metodo con ese codigo', '/admin/hotels/payment-methods/new')
    }

    const row = await PaymentMethod.create({
      code,
      name: payload.name,
      requiresReference: payload.requiresReference ?? false,
      requiresProof: payload.requiresProof ?? false,
      isCash: payload.isCash ?? false,
      isOnline: payload.isOnline ?? false,
      isActive: payload.isActive ?? true,
    })

    await AuditLogger.log(
      {
        action: 'CREATE',
        entity: 'payment_method',
        entityId: row.id,
        oldValues: null,
        newValues: row.serialize(),
        metadata: { source: 'admin.hotels.paymentMethods.store' },
      },
      ctx
    )

    return respondSuccessOrJson(ctx, 'Metodo de pago creado', '/admin/hotels/payment-methods', row, true)
  }

  async update(ctx: HttpContext) {
    const row = await PaymentMethod.findOrFail(ctx.params.id)
    const payload = await ctx.request.validateUsing(createPaymentMethodValidator)
    const code = payload.code.trim().toUpperCase()

    const duplicate = await PaymentMethod.query().where('code', code).whereNot('id', row.id).first()
    if (duplicate) {
      return respondConflictOrRedirect(
        ctx,
        'Ya existe un metodo con ese codigo',
        `/admin/hotels/payment-methods/${row.id}/edit`
      )
    }

    const previous = row.serialize()

    row.merge({
      code,
      name: payload.name,
      requiresReference: payload.requiresReference ?? false,
      requiresProof: payload.requiresProof ?? false,
      isCash: payload.isCash ?? false,
      isOnline: payload.isOnline ?? false,
      isActive: payload.isActive ?? true,
    })

    await row.save()

    await AuditLogger.log(
      {
        action: 'UPDATE',
        entity: 'payment_method',
        entityId: row.id,
        oldValues: previous,
        newValues: row.serialize(),
        metadata: { source: 'admin.hotels.paymentMethods.update' },
      },
      ctx
    )

    return respondSuccessOrJson(ctx, 'Metodo de pago actualizado', '/admin/hotels/payment-methods', row)
  }
}
