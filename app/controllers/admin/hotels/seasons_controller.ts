import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import Season from '#models/season'
import AuditLogger from '#services/audit_logger'
import { createSeasonValidator } from '#validators/admin/hotels/create_season_validator'
import {
  prefersHtml,
  renderCatalogForm,
  renderCatalogIndex,
  respondConflictOrRedirect,
  respondSuccessOrJson,
  type CatalogField,
} from '#controllers/admin/hotels/ui_support'
import {
  seasonTypeLabel,
  seasonTypeOptions,
} from '#controllers/admin/hotels/ui_enum_labels'

type SeasonType = 'HIGH' | 'LOW' | 'PROMOTIONAL' | 'SPECIAL'

export default class SeasonsController {
  async index(ctx: HttpContext) {
    const rows = await Season.query().orderBy('starts_at', 'asc')

    if (prefersHtml(ctx)) {
      return renderCatalogIndex(ctx, {
        pageKicker: 'Operación hotelera',
        pageTitle: 'Temporadas',
        pageSubtitle: 'Define bloques de vigencia para estrategias de precio.',
        createHref: '/admin/hotels/seasons/new',
        createLabel: 'Nueva temporada',
        editBaseHref: '/admin/hotels/seasons',
        columns: [
          { key: 'id', label: 'ID' },
          { key: 'code', label: 'Código', badge: true },
          { key: 'name', label: 'Nombre' },
          { key: 'seasonType', label: 'Tipo', badge: true },
          { key: 'range', label: 'Rango' },
          { key: 'isActive', label: 'Activo', badge: true },
        ],
        rows: rows.map((row) => ({
          id: row.id,
          code: row.code,
          name: row.name,
          seasonType: seasonTypeLabel(row.seasonType),
          range: `${row.startsAt.toFormat('yyyy-LL-dd')} -> ${row.endsAt.toFormat('yyyy-LL-dd')}`,
          isActive: row.isActive ? 'Sí' : 'No',
        })),
      })
    }

    const { response } = ctx
    return response.ok({ data: rows })
  }

  private seasonFields(): CatalogField[] {
    return [
      { name: 'code', label: 'Código', required: true },
      { name: 'name', label: 'Nombre', required: true },
      { name: 'seasonType', label: 'Clasificación de temporada', type: 'select', options: seasonTypeOptions },
      { name: 'startsAt', label: 'Inicio', type: 'date', required: true },
      { name: 'endsAt', label: 'Fin', type: 'date', required: true },
      { name: 'priority', label: 'Prioridad', type: 'number', min: 0 },
      { name: 'isActive', label: 'Activa', type: 'checkbox', colSpanMd: 2, colSpanXl: 1 },
    ]
  }

  async create(ctx: HttpContext) {
    return renderCatalogForm(ctx, {
      formMode: 'create',
      formKicker: 'Operación hotelera',
      formTitle: 'Nueva temporada',
      formSubtitle: 'Configura un rango de fechas con tipo y prioridad.',
      formAction: '/admin/hotels/seasons',
      submitLabel: 'Crear temporada',
      backHref: '/admin/hotels/seasons',
      fields: this.seasonFields(),
      values: { seasonType: 'SPECIAL', priority: 100, isActive: true },
    })
  }

  async edit(ctx: HttpContext) {
    const row = await Season.findOrFail(ctx.params.id)

    return renderCatalogForm(ctx, {
      formMode: 'edit',
      formKicker: 'Operación hotelera',
      formTitle: `Editar temporada #${row.id}`,
      formSubtitle: 'Ajusta vigencia y prioridad para cálculos tarifarios.',
      formAction: `/admin/hotels/seasons/${row.id}/update`,
      submitLabel: 'Guardar cambios',
      backHref: '/admin/hotels/seasons',
      fields: this.seasonFields(),
      values: {
        code: row.code,
        name: row.name,
        seasonType: row.seasonType,
        startsAt: row.startsAt.toISODate(),
        endsAt: row.endsAt.toISODate(),
        priority: row.priority,
        isActive: row.isActive,
      },
    })
  }

  async store(ctx: HttpContext) {
    const { request } = ctx
    const payload = await request.validateUsing(createSeasonValidator)

    const startsAt = DateTime.fromJSDate(payload.startsAt)
    const endsAt = DateTime.fromJSDate(payload.endsAt)
    if (endsAt <= startsAt) {
      return respondConflictOrRedirect(ctx, 'endsAt debe ser mayor a startsAt', '/admin/hotels/seasons/new', 400)
    }

    const code = payload.code.trim().toUpperCase()
    const duplicate = await Season.query().where('code', code).first()
    if (duplicate) {
      return respondConflictOrRedirect(ctx, `Ya existe una temporada con codigo ${code}`, '/admin/hotels/seasons/new')
    }

    const row = await Season.create({
      code,
      name: payload.name,
      seasonType: (payload.seasonType as SeasonType | undefined) ?? 'SPECIAL',
      startsAt,
      endsAt,
      priority: payload.priority ?? 100,
      isActive: payload.isActive ?? true,
      createdByUserId: ctx.auth.user?.id ?? null,
      updatedByUserId: ctx.auth.user?.id ?? null,
    })

    await AuditLogger.log(
      {
        action: 'CREATE',
        entity: 'season',
        entityId: row.id,
        oldValues: null,
        newValues: {
          code: row.code,
          seasonType: row.seasonType,
          startsAt: row.startsAt.toISO(),
          endsAt: row.endsAt.toISO(),
          isActive: row.isActive,
        },
        metadata: { source: 'admin.hotels.seasons.store' },
      },
      ctx
    )

    return respondSuccessOrJson(ctx, 'Temporada creada', '/admin/hotels/seasons', row, true)
  }

  async update(ctx: HttpContext) {
    const { params, request } = ctx
    const row = await Season.findOrFail(params.id)
    const payload = await request.validateUsing(createSeasonValidator)

    const startsAt = DateTime.fromJSDate(payload.startsAt)
    const endsAt = DateTime.fromJSDate(payload.endsAt)
    if (endsAt <= startsAt) {
      return respondConflictOrRedirect(ctx, 'endsAt debe ser mayor a startsAt', `/admin/hotels/seasons/${row.id}/edit`, 400)
    }

    const code = payload.code.trim().toUpperCase()
    const duplicate = await Season.query().where('code', code).whereNot('id', row.id).first()
    if (duplicate) {
      return respondConflictOrRedirect(
        ctx,
        `Ya existe otra temporada con codigo ${code}`,
        `/admin/hotels/seasons/${row.id}/edit`
      )
    }

    const previous = {
      code: row.code,
      seasonType: row.seasonType,
      startsAt: row.startsAt.toISO(),
      endsAt: row.endsAt.toISO(),
      isActive: row.isActive,
    }

    row.code = code
    row.name = payload.name
    row.seasonType = (payload.seasonType as SeasonType | undefined) ?? row.seasonType
    row.startsAt = startsAt
    row.endsAt = endsAt
    row.priority = payload.priority ?? row.priority
    row.isActive = payload.isActive ?? row.isActive
    row.updatedByUserId = ctx.auth.user?.id ?? null
    await row.save()

    await AuditLogger.log(
      {
        action: 'UPDATE',
        entity: 'season',
        entityId: row.id,
        oldValues: previous,
        newValues: {
          code: row.code,
          seasonType: row.seasonType,
          startsAt: row.startsAt.toISO(),
          endsAt: row.endsAt.toISO(),
          isActive: row.isActive,
        },
        metadata: { source: 'admin.hotels.seasons.update' },
      },
      ctx
    )

    return respondSuccessOrJson(ctx, 'Temporada actualizada', '/admin/hotels/seasons', row)
  }
}
