import type { HttpContext } from '@adonisjs/core/http'
import Room from '#models/room'
import RoomType from '#models/room_type'
import AuditLogger from '#services/audit_logger'
import { createRoomValidator } from '#validators/admin/hotels/create_room_validator'
import {
  prefersHtml,
  renderCatalogForm,
  renderCatalogIndex,
  respondConflictOrRedirect,
  respondSuccessOrJson,
  type CatalogField,
} from '#controllers/admin/hotels/ui_support'
import {
  roomStatusLabel,
  roomStatusOptions,
} from '#controllers/admin/hotels/ui_enum_labels'

type RoomStatus =
  | 'AVAILABLE_CLEAN'
  | 'RESERVED'
  | 'OCCUPIED'
  | 'DIRTY'
  | 'CLEANING_IN_PROGRESS'
  | 'INSPECTED'
  | 'BLOCKED'
  | 'MAINTENANCE'
  | 'OUT_OF_SERVICE'

export default class RoomsController {
  async index(ctx: HttpContext) {
    const rows = await Room.query().preload('roomType').orderBy('id', 'asc')

    if (prefersHtml(ctx)) {
      return renderCatalogIndex(ctx, {
        pageKicker: 'Operación hotelera',
        pageTitle: 'Habitaciones',
        pageSubtitle: 'Administra inventario físico, estado operativo y tipo asignado.',
        createHref: '/admin/hotels/rooms/new',
        createLabel: 'Nueva habitación',
        editBaseHref: '/admin/hotels/rooms',
        columns: [
          { key: 'id', label: 'ID' },
          { key: 'roomNumber', label: 'Número', badge: true },
          { key: 'roomType', label: 'Tipo' },
          { key: 'floorNumber', label: 'Nivel' },
          { key: 'currentStatus', label: 'Estado', badge: true },
          { key: 'isActive', label: 'Activo', badge: true },
        ],
        rows: rows.map((row) => ({
          id: row.id,
          roomNumber: row.roomNumber,
          roomType: `${row.roomType.code} - ${row.roomType.name}`,
          floorNumber: row.floorNumber ?? '-',
          currentStatus: roomStatusLabel(row.currentStatus),
          isActive: row.isActive ? 'Sí' : 'No',
        })),
      })
    }

    const { response } = ctx
    return response.ok({ data: rows })
  }

  async create(ctx: HttpContext) {
    const roomTypes = await RoomType.query().orderBy('code', 'asc')
    const fields: CatalogField[] = [
      {
        name: 'roomTypeId',
        label: 'Tipo de habitación',
        type: 'select',
        required: true,
        colSpanMd: 2,
        colSpanXl: 1,
        options: roomTypes.map((item) => ({ value: item.id, label: `${item.code} - ${item.name}` })),
      },
      { name: 'roomNumber', label: 'Número de habitación', required: true },
      { name: 'name', label: 'Nombre interno' },
      { name: 'floorNumber', label: 'Nivel/Piso', type: 'number' },
      { name: 'currentStatus', label: 'Estado operativo', type: 'select', options: roomStatusOptions },
      { name: 'isSmokingAllowed', label: 'Permite fumar', type: 'checkbox', colSpanMd: 2, colSpanXl: 1 },
      { name: 'isActive', label: 'Activo', type: 'checkbox' },
      { name: 'internalNotes', label: 'Notas internas', type: 'textarea', fullWidth: true },
    ]

    return renderCatalogForm(ctx, {
      formMode: 'create',
      formKicker: 'Operación hotelera',
      formTitle: 'Nueva habitación',
      formSubtitle: 'Configura una habitación física y su estado inicial de operación.',
      formAction: '/admin/hotels/rooms',
      submitLabel: 'Crear habitación',
      backHref: '/admin/hotels/rooms',
      fields,
      values: { currentStatus: 'AVAILABLE_CLEAN', isActive: true, isSmokingAllowed: false },
    })
  }

  async edit(ctx: HttpContext) {
    const row = await Room.findOrFail(ctx.params.id)
    const roomTypes = await RoomType.query().orderBy('code', 'asc')
    const fields: CatalogField[] = [
      {
        name: 'roomTypeId',
        label: 'Tipo de habitación',
        type: 'select',
        required: true,
        colSpanMd: 2,
        colSpanXl: 1,
        options: roomTypes.map((item) => ({ value: item.id, label: `${item.code} - ${item.name}` })),
      },
      { name: 'roomNumber', label: 'Número de habitación', required: true },
      { name: 'name', label: 'Nombre interno' },
      { name: 'floorNumber', label: 'Nivel/Piso', type: 'number' },
      { name: 'currentStatus', label: 'Estado operativo', type: 'select', options: roomStatusOptions },
      { name: 'isSmokingAllowed', label: 'Permite fumar', type: 'checkbox', colSpanMd: 2, colSpanXl: 1 },
      { name: 'isActive', label: 'Activo', type: 'checkbox' },
      { name: 'internalNotes', label: 'Notas internas', type: 'textarea', fullWidth: true },
    ]

    return renderCatalogForm(ctx, {
      formMode: 'edit',
      formKicker: 'Operación hotelera',
      formTitle: `Editar habitación #${row.id}`,
      formSubtitle: 'Actualiza asignación, estado y datos operativos.',
      formAction: `/admin/hotels/rooms/${row.id}/update`,
      submitLabel: 'Guardar cambios',
      backHref: '/admin/hotels/rooms',
      fields,
      values: {
        roomTypeId: row.roomTypeId,
        roomNumber: row.roomNumber,
        name: row.name,
        floorNumber: row.floorNumber,
        currentStatus: row.currentStatus,
        isSmokingAllowed: row.isSmokingAllowed,
        internalNotes: row.internalNotes,
        isActive: row.isActive,
      },
    })
  }

  async store(ctx: HttpContext) {
    const { request } = ctx
    const payload = await request.validateUsing(createRoomValidator)

    const roomType = await RoomType.find(payload.roomTypeId)
    if (!roomType) {
      return respondConflictOrRedirect(ctx, 'roomTypeId no existe', '/admin/hotels/rooms/new', 400)
    }

    const roomNumber = payload.roomNumber.trim().toUpperCase()
    const duplicate = await Room.query().where('room_number', roomNumber).first()
    if (duplicate) {
      return respondConflictOrRedirect(ctx, `Ya existe una habitacion con numero ${roomNumber}`, '/admin/hotels/rooms/new')
    }

    const row = await Room.create({
      roomTypeId: payload.roomTypeId,
      roomNumber,
      name: payload.name ?? null,
      floorNumber: payload.floorNumber ?? null,
      currentStatus: (payload.currentStatus as RoomStatus | undefined) ?? 'AVAILABLE_CLEAN',
      isSmokingAllowed: payload.isSmokingAllowed ?? false,
      internalNotes: payload.internalNotes ?? null,
      isActive: payload.isActive ?? true,
      createdByUserId: ctx.auth.user?.id ?? null,
      updatedByUserId: ctx.auth.user?.id ?? null,
    })

    await AuditLogger.log(
      {
        action: 'CREATE',
        entity: 'room',
        entityId: row.id,
        oldValues: null,
        newValues: {
          roomTypeId: row.roomTypeId,
          roomNumber: row.roomNumber,
          currentStatus: row.currentStatus,
          isActive: row.isActive,
        },
        metadata: { source: 'admin.hotels.rooms.store' },
      },
      ctx
    )

    return respondSuccessOrJson(ctx, 'Habitacion creada', '/admin/hotels/rooms', row, true)
  }

  async update(ctx: HttpContext) {
    const { params, request } = ctx
    const row = await Room.findOrFail(params.id)
    const payload = await request.validateUsing(createRoomValidator)

    const roomType = await RoomType.find(payload.roomTypeId)
    if (!roomType) {
      return respondConflictOrRedirect(ctx, 'roomTypeId no existe', `/admin/hotels/rooms/${row.id}/edit`, 400)
    }

    const roomNumber = payload.roomNumber.trim().toUpperCase()
    const duplicate = await Room.query().where('room_number', roomNumber).whereNot('id', row.id).first()
    if (duplicate) {
      return respondConflictOrRedirect(
        ctx,
        `Ya existe otra habitacion con numero ${roomNumber}`,
        `/admin/hotels/rooms/${row.id}/edit`
      )
    }

    const previous = {
      roomTypeId: row.roomTypeId,
      roomNumber: row.roomNumber,
      currentStatus: row.currentStatus,
      isActive: row.isActive,
    }

    row.roomTypeId = payload.roomTypeId
    row.roomNumber = roomNumber
    row.name = payload.name ?? null
    row.floorNumber = payload.floorNumber ?? null
    row.currentStatus = (payload.currentStatus as RoomStatus | undefined) ?? row.currentStatus
    row.isSmokingAllowed = payload.isSmokingAllowed ?? row.isSmokingAllowed
    row.internalNotes = payload.internalNotes ?? null
    row.isActive = payload.isActive ?? row.isActive
    row.updatedByUserId = ctx.auth.user?.id ?? null
    await row.save()

    await AuditLogger.log(
      {
        action: 'UPDATE',
        entity: 'room',
        entityId: row.id,
        oldValues: previous,
        newValues: {
          roomTypeId: row.roomTypeId,
          roomNumber: row.roomNumber,
          currentStatus: row.currentStatus,
          isActive: row.isActive,
        },
        metadata: { source: 'admin.hotels.rooms.update' },
      },
      ctx
    )

    return respondSuccessOrJson(ctx, 'Habitacion actualizada', '/admin/hotels/rooms', row)
  }
}
