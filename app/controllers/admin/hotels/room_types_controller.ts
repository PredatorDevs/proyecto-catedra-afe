import type { HttpContext } from '@adonisjs/core/http'
import RoomType from '#models/room_type'
import AuditLogger from '#services/audit_logger'
import { createRoomTypeValidator } from '#validators/admin/hotels/create_room_type_validator'
import {
  prefersHtml,
  renderCatalogForm,
  renderCatalogIndex,
  respondConflictOrRedirect,
  respondSuccessOrJson,
  type CatalogField,
} from '#controllers/admin/hotels/ui_support'

const roomTypeFields: CatalogField[] = [
  { name: 'code', label: 'Código', required: true },
  { name: 'name', label: 'Nombre', required: true },
  { name: 'bedType', label: 'Tipo de cama' },
  { name: 'baseCapacity', label: 'Capacidad base', type: 'number', required: true, min: 1 },
  { name: 'maxCapacity', label: 'Capacidad máxima', type: 'number', required: true, min: 1 },
  { name: 'bedCount', label: 'Cantidad de camas', type: 'number', required: true, min: 1 },
  { name: 'defaultNightlyPrice', label: 'Tarifa nocturna base', type: 'number', required: true, min: 0, step: '0.01' },
  { name: 'description', label: 'Descripción', type: 'textarea', fullWidth: true },
  { name: 'hasPrivateBathroom', label: 'Baño privado', type: 'checkbox', colSpanMd: 2, colSpanXl: 1 },
  { name: 'isActive', label: 'Activo', type: 'checkbox' },
]

function baseFormPayload() {
  return {
    formKicker: 'Operación hotelera',
    fields: roomTypeFields,
    backHref: '/admin/hotels/room-types',
  }
}

export default class RoomTypesController {
  async index(ctx: HttpContext) {
    const rows = await RoomType.query().orderBy('id', 'asc')

    if (prefersHtml(ctx)) {
      return renderCatalogIndex(ctx, {
        pageKicker: 'Operación hotelera',
        pageTitle: 'Tipos de Habitación',
        pageSubtitle: 'Define capacidad, configuración de camas y tarifa de referencia por tipo.',
        createHref: '/admin/hotels/room-types/new',
        createLabel: 'Nuevo tipo',
        editBaseHref: '/admin/hotels/room-types',
        columns: [
          { key: 'id', label: 'ID' },
          { key: 'code', label: 'Código', badge: true },
          { key: 'name', label: 'Nombre' },
          { key: 'capacity', label: 'Capacidad' },
          { key: 'defaultNightlyPrice', label: 'Precio base' },
          { key: 'isActive', label: 'Activo', badge: true },
        ],
        rows: rows.map((row) => ({
          id: row.id,
          code: row.code,
          name: row.name,
          capacity: `${row.baseCapacity}-${row.maxCapacity}`,
          defaultNightlyPrice: Number(row.defaultNightlyPrice).toFixed(2),
          isActive: row.isActive ? 'Sí' : 'No',
        })),
      })
    }

    const { response } = ctx
    return response.ok({ data: rows })
  }

  async create(ctx: HttpContext) {
    return renderCatalogForm(ctx, {
      ...baseFormPayload(),
      formMode: 'create',
      formTitle: 'Nuevo tipo de habitación',
      formSubtitle: 'Registra un tipo con capacidad y tarifa base para usarlo en inventario.',
      formAction: '/admin/hotels/room-types',
      submitLabel: 'Crear tipo',
      values: { hasPrivateBathroom: true, isActive: true },
    })
  }

  async edit(ctx: HttpContext) {
    const row = await RoomType.findOrFail(ctx.params.id)

    return renderCatalogForm(ctx, {
      ...baseFormPayload(),
      formMode: 'edit',
      formTitle: `Editar tipo #${row.id}`,
      formSubtitle: 'Actualiza datos operativos del tipo de habitación.',
      formAction: `/admin/hotels/room-types/${row.id}/update`,
      submitLabel: 'Guardar cambios',
      values: {
        code: row.code,
        name: row.name,
        description: row.description,
        baseCapacity: row.baseCapacity,
        maxCapacity: row.maxCapacity,
        bedType: row.bedType,
        bedCount: row.bedCount,
        hasPrivateBathroom: row.hasPrivateBathroom,
        defaultNightlyPrice: row.defaultNightlyPrice,
        isActive: row.isActive,
      },
    })
  }

  async store(ctx: HttpContext) {
    const { request } = ctx
    const payload = await request.validateUsing(createRoomTypeValidator)

    if (payload.maxCapacity < payload.baseCapacity) {
      return respondConflictOrRedirect(ctx, 'maxCapacity no puede ser menor a baseCapacity', '/admin/hotels/room-types/new', 400)
    }

    const code = payload.code.trim().toUpperCase()
    const duplicate = await RoomType.query().where('code', code).first()
    if (duplicate) {
      return respondConflictOrRedirect(ctx, `Ya existe un tipo de habitacion con codigo ${code}`, '/admin/hotels/room-types/new')
    }

    const row = await RoomType.create({
      code,
      name: payload.name,
      description: payload.description ?? null,
      baseCapacity: payload.baseCapacity,
      maxCapacity: payload.maxCapacity,
      bedType: payload.bedType ?? null,
      bedCount: payload.bedCount,
      hasPrivateBathroom: payload.hasPrivateBathroom ?? true,
      defaultNightlyPrice: payload.defaultNightlyPrice,
      isActive: payload.isActive ?? true,
      createdByUserId: ctx.auth.user?.id ?? null,
      updatedByUserId: ctx.auth.user?.id ?? null,
    })

    await AuditLogger.log(
      {
        action: 'CREATE',
        entity: 'room_type',
        entityId: row.id,
        oldValues: null,
        newValues: {
          code: row.code,
          name: row.name,
          baseCapacity: row.baseCapacity,
          maxCapacity: row.maxCapacity,
          defaultNightlyPrice: row.defaultNightlyPrice,
          isActive: row.isActive,
        },
        metadata: { source: 'admin.hotels.roomTypes.store' },
      },
      ctx
    )

    return respondSuccessOrJson(ctx, 'Tipo de habitacion creado', '/admin/hotels/room-types', row, true)
  }

  async update(ctx: HttpContext) {
    const { params, request } = ctx
    const row = await RoomType.findOrFail(params.id)
    const payload = await request.validateUsing(createRoomTypeValidator)

    if (payload.maxCapacity < payload.baseCapacity) {
      return respondConflictOrRedirect(ctx, 'maxCapacity no puede ser menor a baseCapacity', `/admin/hotels/room-types/${row.id}/edit`, 400)
    }

    const code = payload.code.trim().toUpperCase()
    const duplicate = await RoomType.query().where('code', code).whereNot('id', row.id).first()
    if (duplicate) {
      return respondConflictOrRedirect(
        ctx,
        `Ya existe otro tipo de habitacion con codigo ${code}`,
        `/admin/hotels/room-types/${row.id}/edit`
      )
    }

    const previous = {
      code: row.code,
      name: row.name,
      baseCapacity: row.baseCapacity,
      maxCapacity: row.maxCapacity,
      defaultNightlyPrice: row.defaultNightlyPrice,
      isActive: row.isActive,
    }

    row.code = code
    row.name = payload.name
    row.description = payload.description ?? null
    row.baseCapacity = payload.baseCapacity
    row.maxCapacity = payload.maxCapacity
    row.bedType = payload.bedType ?? null
    row.bedCount = payload.bedCount
    row.hasPrivateBathroom = payload.hasPrivateBathroom ?? row.hasPrivateBathroom
    row.defaultNightlyPrice = payload.defaultNightlyPrice
    row.isActive = payload.isActive ?? row.isActive
    row.updatedByUserId = ctx.auth.user?.id ?? null
    await row.save()

    await AuditLogger.log(
      {
        action: 'UPDATE',
        entity: 'room_type',
        entityId: row.id,
        oldValues: previous,
        newValues: {
          code: row.code,
          name: row.name,
          baseCapacity: row.baseCapacity,
          maxCapacity: row.maxCapacity,
          defaultNightlyPrice: row.defaultNightlyPrice,
          isActive: row.isActive,
        },
        metadata: { source: 'admin.hotels.roomTypes.update' },
      },
      ctx
    )

    return respondSuccessOrJson(ctx, 'Tipo de habitacion actualizado', '/admin/hotels/room-types', row)
  }
}
