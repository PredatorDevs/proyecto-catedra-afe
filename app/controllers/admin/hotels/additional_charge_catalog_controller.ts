import type { HttpContext } from '@adonisjs/core/http'
import AdditionalChargeCatalog from '#models/additional_charge_catalog'
import AuditLogger from '#services/audit_logger'
import { createAdditionalChargeCatalogValidator } from '#validators/admin/hotels/create_additional_charge_catalog_validator'
import {
  prefersHtml,
  renderCatalogForm,
  renderCatalogIndex,
  respondConflictOrRedirect,
  respondSuccessOrJson,
  type CatalogField,
} from '#controllers/admin/hotels/ui_support'
import {
  chargeKindLabel,
  chargeKindOptions,
  unitOfMeasureOptions,
} from '#controllers/admin/hotels/ui_enum_labels'

type ChargeKind = 'PRODUCT' | 'SERVICE' | 'PENALTY' | 'EXTRA_GUEST' | 'OTHER'
type UnitOfMeasure = 'UNIT' | 'DAY' | 'HOUR' | 'PERSON' | 'SERVICE'

export default class AdditionalChargeCatalogController {
  async index(ctx: HttpContext) {
    const rows = await AdditionalChargeCatalog.query().orderBy('id', 'asc')

    if (prefersHtml(ctx)) {
      return renderCatalogIndex(ctx, {
        pageKicker: 'Operación hotelera',
        pageTitle: 'Cargos Adicionales',
        pageSubtitle: 'Catálogo de servicios y productos extra con configuración fiscal.',
        createHref: '/admin/hotels/additional-charges/new',
        createLabel: 'Nuevo cargo',
        editBaseHref: '/admin/hotels/additional-charges',
        columns: [
          { key: 'id', label: 'ID' },
          { key: 'chargeCode', label: 'Código', badge: true },
          { key: 'name', label: 'Nombre' },
          { key: 'chargeKind', label: 'Tipo', badge: true },
          { key: 'unitPrice', label: 'Precio' },
          { key: 'isActive', label: 'Activo', badge: true },
        ],
        rows: rows.map((row) => ({
          id: row.id,
          chargeCode: row.chargeCode,
          name: row.name,
          chargeKind: chargeKindLabel(row.chargeKind),
          unitPrice: Number(row.unitPrice).toFixed(2),
          isActive: row.isActive ? 'Sí' : 'No',
        })),
      })
    }

    const { response } = ctx
    return response.ok({ data: rows })
  }

  private fields(): CatalogField[] {
    return [
      { name: 'chargeCode', label: 'Código', required: true },
      { name: 'name', label: 'Nombre', required: true },
      { name: 'chargeKind', label: 'Tipo de cargo', type: 'select', options: chargeKindOptions },
      { name: 'unitOfMeasure', label: 'Unidad de medida', type: 'select', options: unitOfMeasureOptions },
      { name: 'unitPrice', label: 'Precio unitario', type: 'number', min: 0, step: '0.01' },
      { name: 'description', label: 'Descripción', type: 'textarea', fullWidth: true },
      { name: 'appliesIva', label: 'Aplica IVA', type: 'checkbox' },
      { name: 'appliesTourismTax', label: 'Aplica impuesto de turismo', type: 'checkbox', colSpanMd: 2, colSpanXl: 1 },
      { name: 'allowManualPrice', label: 'Permite ajuste manual de precio', type: 'checkbox' },
      { name: 'isActive', label: 'Activo', type: 'checkbox' },
    ]
  }

  async create(ctx: HttpContext) {
    return renderCatalogForm(ctx, {
      formMode: 'create',
      formKicker: 'Operación hotelera',
      formTitle: 'Nuevo cargo adicional',
      formSubtitle: 'Registra un concepto de cobro complementario para reservas/estadías.',
      formAction: '/admin/hotels/additional-charges',
      submitLabel: 'Crear cargo',
      backHref: '/admin/hotels/additional-charges',
      fields: this.fields(),
      values: { chargeKind: 'SERVICE', unitOfMeasure: 'UNIT', appliesIva: true, isActive: true },
    })
  }

  async edit(ctx: HttpContext) {
    const row = await AdditionalChargeCatalog.findOrFail(ctx.params.id)

    return renderCatalogForm(ctx, {
      formMode: 'edit',
      formKicker: 'Operación hotelera',
      formTitle: `Editar cargo #${row.id}`,
      formSubtitle: 'Ajusta configuración de precio, impuestos y vigencia.',
      formAction: `/admin/hotels/additional-charges/${row.id}/update`,
      submitLabel: 'Guardar cambios',
      backHref: '/admin/hotels/additional-charges',
      fields: this.fields(),
      values: {
        chargeCode: row.chargeCode,
        name: row.name,
        description: row.description,
        chargeKind: row.chargeKind,
        unitOfMeasure: row.unitOfMeasure,
        unitPrice: row.unitPrice,
        appliesIva: row.appliesIva,
        appliesTourismTax: row.appliesTourismTax,
        allowManualPrice: row.allowManualPrice,
        isActive: row.isActive,
      },
    })
  }

  async store(ctx: HttpContext) {
    const { request } = ctx
    const payload = await request.validateUsing(createAdditionalChargeCatalogValidator)

    const chargeCode = payload.chargeCode.trim().toUpperCase()
    const duplicate = await AdditionalChargeCatalog.query().where('charge_code', chargeCode).first()
    if (duplicate) {
      return respondConflictOrRedirect(ctx, `Ya existe un cargo con codigo ${chargeCode}`, '/admin/hotels/additional-charges/new')
    }

    const row = await AdditionalChargeCatalog.create({
      chargeCode,
      name: payload.name,
      description: payload.description ?? null,
      chargeKind: (payload.chargeKind as ChargeKind | undefined) ?? 'SERVICE',
      unitOfMeasure: (payload.unitOfMeasure as UnitOfMeasure | undefined) ?? 'UNIT',
      unitPrice: payload.unitPrice ?? 0,
      appliesIva: payload.appliesIva ?? true,
      appliesTourismTax: payload.appliesTourismTax ?? false,
      allowManualPrice: payload.allowManualPrice ?? false,
      isActive: payload.isActive ?? true,
      createdByUserId: ctx.auth.user?.id ?? null,
      updatedByUserId: ctx.auth.user?.id ?? null,
    })

    await AuditLogger.log(
      {
        action: 'CREATE',
        entity: 'additional_charge_catalog',
        entityId: row.id,
        oldValues: null,
        newValues: {
          chargeCode: row.chargeCode,
          name: row.name,
          chargeKind: row.chargeKind,
          unitPrice: row.unitPrice,
          isActive: row.isActive,
        },
        metadata: { source: 'admin.hotels.additionalCharges.store' },
      },
      ctx
    )

    return respondSuccessOrJson(ctx, 'Cargo adicional creado', '/admin/hotels/additional-charges', row, true)
  }

  async update(ctx: HttpContext) {
    const { params, request } = ctx
    const row = await AdditionalChargeCatalog.findOrFail(params.id)
    const payload = await request.validateUsing(createAdditionalChargeCatalogValidator)

    const chargeCode = payload.chargeCode.trim().toUpperCase()
    const duplicate = await AdditionalChargeCatalog.query()
      .where('charge_code', chargeCode)
      .whereNot('id', row.id)
      .first()
    if (duplicate) {
      return respondConflictOrRedirect(
        ctx,
        `Ya existe otro cargo con codigo ${chargeCode}`,
        `/admin/hotels/additional-charges/${row.id}/edit`
      )
    }

    const previous = {
      chargeCode: row.chargeCode,
      name: row.name,
      chargeKind: row.chargeKind,
      unitPrice: row.unitPrice,
      isActive: row.isActive,
    }

    row.chargeCode = chargeCode
    row.name = payload.name
    row.description = payload.description ?? null
    row.chargeKind = (payload.chargeKind as ChargeKind | undefined) ?? row.chargeKind
    row.unitOfMeasure = (payload.unitOfMeasure as UnitOfMeasure | undefined) ?? row.unitOfMeasure
    row.unitPrice = payload.unitPrice ?? row.unitPrice
    row.appliesIva = payload.appliesIva ?? row.appliesIva
    row.appliesTourismTax = payload.appliesTourismTax ?? row.appliesTourismTax
    row.allowManualPrice = payload.allowManualPrice ?? row.allowManualPrice
    row.isActive = payload.isActive ?? row.isActive
    row.updatedByUserId = ctx.auth.user?.id ?? null
    await row.save()

    await AuditLogger.log(
      {
        action: 'UPDATE',
        entity: 'additional_charge_catalog',
        entityId: row.id,
        oldValues: previous,
        newValues: {
          chargeCode: row.chargeCode,
          name: row.name,
          chargeKind: row.chargeKind,
          unitPrice: row.unitPrice,
          isActive: row.isActive,
        },
        metadata: { source: 'admin.hotels.additionalCharges.update' },
      },
      ctx
    )

    return respondSuccessOrJson(ctx, 'Cargo adicional actualizado', '/admin/hotels/additional-charges', row)
  }
}
