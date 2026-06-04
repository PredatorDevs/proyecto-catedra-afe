import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import RoomPrice from '#models/room_price'
import Room from '#models/room'
import RoomType from '#models/room_type'
import Season from '#models/season'
import AuditLogger from '#services/audit_logger'
import { createRoomPriceValidator } from '#validators/admin/hotels/create_room_price_validator'
import {
  prefersHtml,
  renderCatalogForm,
  renderCatalogIndex,
  respondConflictOrRedirect,
  respondSuccessOrJson,
  type CatalogField,
} from '#controllers/admin/hotels/ui_support'
import {
  priceBasisLabel,
  priceBasisOptions,
  pricingScopeLabel,
  pricingScopeOptions,
} from '#controllers/admin/hotels/ui_enum_labels'

type PricingScope = 'ROOM_TYPE' | 'ROOM'
type PriceBasis = 'NIGHT' | 'STAY'

type RoomPricePayload = {
  roomTypeId: number
  roomId?: number
  seasonId?: number
  name: string
  pricingScope?: string
  priceBasis?: string
  validFrom: Date
  validTo: Date
  daysOfWeekMask?: string
  basePrice: number
  extraGuestPrice?: number
  priority?: number
  isActive?: boolean
}

function normalizeMask(mask: string | undefined) {
  const resolved = (mask || '1111111').trim()
  return /^[01]{7}$/.test(resolved) ? resolved : null
}

export default class RoomPricesController {
  async index(ctx: HttpContext) {
    const rows = await RoomPrice.query()
      .preload('roomType')
      .preload('room')
      .preload('season')
      .orderBy('id', 'asc')

    if (prefersHtml(ctx)) {
      return renderCatalogIndex(ctx, {
        pageKicker: 'Operación hotelera',
        pageTitle: 'Tarifas de Habitación',
        pageSubtitle: 'Define tarifas por vigencia con alcance por tipo o por habitación específica.',
        createHref: '/admin/hotels/room-prices/new',
        createLabel: 'Nueva tarifa',
        editBaseHref: '/admin/hotels/room-prices',
        columns: [
          { key: 'id', label: 'ID' },
          { key: 'name', label: 'Nombre' },
          { key: 'scope', label: 'Alcance tarifario', badge: true },
          { key: 'priceBasis', label: 'Base de cobro', badge: true },
          { key: 'roomType', label: 'Tipo Habitación' },
          { key: 'range', label: 'Vigencia' },
          { key: 'basePrice', label: 'Tarifa base' },
          { key: 'isActive', label: 'Activa', badge: true },
        ],
        rows: rows.map((row) => ({
          id: row.id,
          name: row.name,
          scope: pricingScopeLabel(row.pricingScope),
          priceBasis: priceBasisLabel(row.priceBasis),
          roomType: row.room ? `${row.roomType.code} / ${row.room.roomNumber}` : row.roomType.code,
          range: `${row.validFrom.toFormat('yyyy-LL-dd')} -> ${row.validTo.toFormat('yyyy-LL-dd')}`,
          basePrice: Number(row.basePrice).toFixed(2),
          isActive: row.isActive ? 'Sí' : 'No',
        })),
      })
    }

    const { response } = ctx
    return response.ok({ data: rows })
  }

  private async fields(): Promise<CatalogField[]> {
    const roomTypes = await RoomType.query().orderBy('code', 'asc')
    const rooms = await Room.query().orderBy('room_number', 'asc')
    const seasons = await Season.query().orderBy('starts_at', 'asc')

    return [
      {
        name: 'roomTypeId',
        label: 'Tipo de habitación',
        type: 'select',
        required: true,
        colSpanMd: 2,
        colSpanXl: 1,
        options: roomTypes.map((item) => ({ value: item.id, label: `${item.code} - ${item.name}` })),
      },
      {
        name: 'roomId',
        label: 'Habitación específica (opcional)',
        helpText:
          'Si seleccionas una habitación concreta, el alcance se ajusta automáticamente a por habitación específica.',
        type: 'select',
        colSpanMd: 2,
        colSpanXl: 1,
        options: rooms.map((item) => ({ value: item.id, label: item.roomNumber })),
      },
      {
        name: 'seasonId',
        label: 'Temporada (opcional)',
        type: 'select',
        colSpanMd: 2,
        colSpanXl: 1,
        options: seasons.map((item) => ({ value: item.id, label: `${item.code} - ${item.name}` })),
      },
      { name: 'name', label: 'Nombre tarifa', required: true, fullWidth: true },
      {
        name: 'pricingScope',
        label: 'Alcance tarifario',
        type: 'select',
        readOnly: true,
        helpText:
          'Se define automáticamente: por tipo de habitación cuando no hay habitación específica, o por habitación específica cuando sí la hay.',
        options: pricingScopeOptions,
      },
      { name: 'priceBasis', label: 'Base de cobro', type: 'select', options: priceBasisOptions },
      { name: 'priority', label: 'Prioridad', type: 'number', min: 0 },
      { name: 'validFrom', label: 'Válido desde', type: 'date', required: true },
      { name: 'validTo', label: 'Válido hasta', type: 'date', required: true },
      { name: 'daysOfWeekMask', label: 'Días aplicables (1111111)' },
      { name: 'basePrice', label: 'Tarifa base', type: 'number', required: true, min: 0, step: '0.01' },
      { name: 'extraGuestPrice', label: 'Tarifa huésped extra', type: 'number', min: 0, step: '0.01' },
      { name: 'isActive', label: 'Activa', type: 'checkbox', colSpanMd: 2, colSpanXl: 1 },
    ]
  }

  async create(ctx: HttpContext) {
    return renderCatalogForm(ctx, {
      formMode: 'create',
      formKicker: 'Operación hotelera',
      formTitle: 'Nueva tarifa de habitación',
      formSubtitle: 'Configura alcance, vigencia y monto para cálculo de cotización.',
      formAction: '/admin/hotels/room-prices',
      submitLabel: 'Crear tarifa',
      backHref: '/admin/hotels/room-prices',
      fields: await this.fields(),
      values: {
        pricingScope: 'ROOM_TYPE',
        priceBasis: 'NIGHT',
        daysOfWeekMask: '1111111',
        priority: 100,
        isActive: true,
      },
    })
  }

  async edit(ctx: HttpContext) {
    const row = await RoomPrice.findOrFail(ctx.params.id)

    return renderCatalogForm(ctx, {
      formMode: 'edit',
      formKicker: 'Operación hotelera',
      formTitle: `Editar tarifa #${row.id}`,
      formSubtitle: 'Ajusta rango de vigencia, alcance y montos.',
      formAction: `/admin/hotels/room-prices/${row.id}/update`,
      submitLabel: 'Guardar cambios',
      backHref: '/admin/hotels/room-prices',
      fields: await this.fields(),
      values: {
        roomTypeId: row.roomTypeId,
        roomId: row.roomId,
        seasonId: row.seasonId,
        name: row.name,
        pricingScope: row.pricingScope,
        priceBasis: row.priceBasis,
        validFrom: row.validFrom.toISODate(),
        validTo: row.validTo.toISODate(),
        daysOfWeekMask: row.daysOfWeekMask,
        basePrice: row.basePrice,
        extraGuestPrice: row.extraGuestPrice,
        priority: row.priority,
        isActive: row.isActive,
      },
    })
  }

  private async validateBusinessRules(
    payload: RoomPricePayload,
    currentId?: number
  ) {
    const priceBasis = (payload.priceBasis as PriceBasis | undefined) ?? 'NIGHT'
    const startsAt = DateTime.fromJSDate(payload.validFrom)
    const endsAt = DateTime.fromJSDate(payload.validTo)
    const mask = normalizeMask(payload.daysOfWeekMask)

    if (endsAt <= startsAt) {
      return { error: 'validTo debe ser mayor a validFrom' }
    }

    if (!mask) {
      return { error: 'daysOfWeekMask debe tener 7 caracteres binarios (0/1)' }
    }

    const roomType = await RoomType.find(payload.roomTypeId)
    if (!roomType) {
      return { error: 'roomTypeId no existe' }
    }

    let roomId: number | null = payload.roomId ?? null
    const pricingScope: PricingScope = roomId ? 'ROOM' : 'ROOM_TYPE'

    if (pricingScope === 'ROOM_TYPE') {
      roomId = null
    }

    if (pricingScope === 'ROOM') {
      if (!roomId) {
        return { error: 'roomId es obligatorio cuando pricingScope es ROOM' }
      }

      const room = await Room.find(roomId)
      if (!room) {
        return { error: 'roomId no existe' }
      }

      if (room.roomTypeId !== payload.roomTypeId) {
        return { error: 'roomId no pertenece al roomTypeId enviado' }
      }
    }

    let seasonId: number | null = payload.seasonId ?? null
    if (seasonId) {
      const season = await Season.find(seasonId)
      if (!season) {
        return { error: 'seasonId no existe' }
      }
    }

    const overlapQuery = RoomPrice.query()
      .where('room_type_id', payload.roomTypeId)
      .where('pricing_scope', pricingScope)
      .where('is_active', 1)
      .where('valid_from', '<', endsAt.toSQL()!)
      .where('valid_to', '>', startsAt.toSQL()!)

    if (roomId === null) {
      overlapQuery.whereNull('room_id')
    } else {
      overlapQuery.where('room_id', roomId)
    }

    if (currentId) {
      overlapQuery.whereNot('id', currentId)
    }

    const overlap = await overlapQuery.first()
    if (overlap) {
      return {
        error:
          'Ya existe una tarifa activa que se solapa en vigencias para la misma combinacion de roomType/pricingScope/roomId',
      }
    }

    return {
      value: {
        pricingScope,
        priceBasis,
        startsAt,
        endsAt,
        mask,
        roomId,
        seasonId,
      },
    }
  }

  async store(ctx: HttpContext) {
    const { request } = ctx
    const payload = await request.validateUsing(createRoomPriceValidator)

    const validation = await this.validateBusinessRules(payload)
    if (validation.error) {
      return respondConflictOrRedirect(ctx, validation.error, '/admin/hotels/room-prices/new', 400)
    }

    const value = validation.value!

    const row = await RoomPrice.create({
      roomTypeId: payload.roomTypeId,
      roomId: value.roomId,
      seasonId: value.seasonId,
      name: payload.name,
      pricingScope: value.pricingScope,
      priceBasis: value.priceBasis,
      validFrom: value.startsAt,
      validTo: value.endsAt,
      daysOfWeekMask: value.mask,
      basePrice: payload.basePrice,
      extraGuestPrice: payload.extraGuestPrice ?? 0,
      priority: payload.priority ?? 100,
      isActive: payload.isActive ?? true,
      createdByUserId: ctx.auth.user?.id ?? null,
      updatedByUserId: ctx.auth.user?.id ?? null,
    })

    await AuditLogger.log(
      {
        action: 'CREATE',
        entity: 'room_price',
        entityId: row.id,
        oldValues: null,
        newValues: {
          roomTypeId: row.roomTypeId,
          roomId: row.roomId,
          pricingScope: row.pricingScope,
          priceBasis: row.priceBasis,
          validFrom: row.validFrom.toISO(),
          validTo: row.validTo.toISO(),
          basePrice: row.basePrice,
          extraGuestPrice: row.extraGuestPrice,
          isActive: row.isActive,
        },
        metadata: { source: 'admin.hotels.roomPrices.store' },
      },
      ctx
    )

    return respondSuccessOrJson(ctx, 'Tarifa de habitacion creada', '/admin/hotels/room-prices', row, true)
  }

  async update(ctx: HttpContext) {
    const { params, request } = ctx
    const row = await RoomPrice.findOrFail(params.id)
    const payload = await request.validateUsing(createRoomPriceValidator)

    const validation = await this.validateBusinessRules(payload, row.id)
    if (validation.error) {
      return respondConflictOrRedirect(ctx, validation.error, `/admin/hotels/room-prices/${row.id}/edit`, 400)
    }

    const value = validation.value!

    const previous = {
      roomTypeId: row.roomTypeId,
      roomId: row.roomId,
      pricingScope: row.pricingScope,
      priceBasis: row.priceBasis,
      validFrom: row.validFrom.toISO(),
      validTo: row.validTo.toISO(),
      basePrice: row.basePrice,
      extraGuestPrice: row.extraGuestPrice,
      isActive: row.isActive,
    }

    row.roomTypeId = payload.roomTypeId
    row.roomId = value.roomId
    row.seasonId = value.seasonId
    row.name = payload.name
    row.pricingScope = value.pricingScope
    row.priceBasis = value.priceBasis
    row.validFrom = value.startsAt
    row.validTo = value.endsAt
    row.daysOfWeekMask = value.mask
    row.basePrice = payload.basePrice
    row.extraGuestPrice = payload.extraGuestPrice ?? row.extraGuestPrice
    row.priority = payload.priority ?? row.priority
    row.isActive = payload.isActive ?? row.isActive
    row.updatedByUserId = ctx.auth.user?.id ?? null
    await row.save()

    await AuditLogger.log(
      {
        action: 'UPDATE',
        entity: 'room_price',
        entityId: row.id,
        oldValues: previous,
        newValues: {
          roomTypeId: row.roomTypeId,
          roomId: row.roomId,
          pricingScope: row.pricingScope,
          priceBasis: row.priceBasis,
          validFrom: row.validFrom.toISO(),
          validTo: row.validTo.toISO(),
          basePrice: row.basePrice,
          extraGuestPrice: row.extraGuestPrice,
          isActive: row.isActive,
        },
        metadata: { source: 'admin.hotels.roomPrices.update' },
      },
      ctx
    )

    return respondSuccessOrJson(ctx, 'Tarifa de habitacion actualizada', '/admin/hotels/room-prices', row)
  }
}
