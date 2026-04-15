import type { HttpContext } from '@adonisjs/core/http'
import Room from '#models/room'
import RoomImage from '#models/room_image'
import AuditLogger from '#services/audit_logger'
import { createRoomImageValidator } from '#validators/admin/hotels/create_room_image_validator'
import {
  prefersHtml,
  renderCatalogForm,
  renderCatalogIndex,
  respondConflictOrRedirect,
  respondSuccessOrJson,
  type CatalogField,
} from '#controllers/admin/hotels/ui_support'

export default class RoomImagesController {
  async index(ctx: HttpContext) {
    const { request } = ctx
    const roomIdInput = Number(request.input('roomId'))

    const query = RoomImage.query().orderBy('sort_order', 'asc').orderBy('id', 'asc')
    if (Number.isFinite(roomIdInput) && roomIdInput > 0) {
      query.where('room_id', roomIdInput)
    }

    const rows = await query

    if (prefersHtml(ctx)) {
      await Promise.all(rows.map((row) => row.load('room')))

      return renderCatalogIndex(ctx, {
        pageKicker: 'Operación hotelera',
        pageTitle: 'Imágenes de Habitación',
        pageSubtitle: 'Gestiona galería y portada por habitación.',
        createHref: '/admin/hotels/room-images/new',
        createLabel: 'Nueva imagen',
        editBaseHref: '/admin/hotels/room-images',
        columns: [
          { key: 'id', label: 'ID' },
          { key: 'room', label: 'Habitación' },
          { key: 'imageUrl', label: 'URL' },
          { key: 'sortOrder', label: 'Orden' },
          { key: 'isCover', label: 'Portada', badge: true },
        ],
        rows: rows.map((row) => ({
          id: row.id,
          room: row.room.roomNumber,
          imageUrl: row.imageUrl,
          sortOrder: row.sortOrder,
          isCover: row.isCover ? 'Sí' : 'No',
        })),
      })
    }

    const { response } = ctx
    return response.ok({ data: rows })
  }

  private async imageFields(): Promise<CatalogField[]> {
    const rooms = await Room.query().orderBy('room_number', 'asc')
    return [
      {
        name: 'roomId',
        label: 'Habitación',
        type: 'select',
        required: true,
        colSpanMd: 2,
        colSpanXl: 1,
        options: rooms.map((room) => ({ value: room.id, label: `${room.roomNumber} - ${room.name || 'Sin nombre'}` })),
      },
      { name: 'imageUrl', label: 'URL imagen', required: true, colSpanMd: 2, colSpanXl: 2 },
      { name: 'caption', label: 'Título/Caption', colSpanMd: 2, colSpanXl: 2 },
      { name: 'sortOrder', label: 'Orden', type: 'number', min: 0 },
      { name: 'isCover', label: 'Imagen portada', type: 'checkbox' },
    ]
  }

  async create(ctx: HttpContext) {
    return renderCatalogForm(ctx, {
      formMode: 'create',
      formKicker: 'Operación hotelera',
      formTitle: 'Nueva imagen de habitación',
      formSubtitle: 'Agrega imágenes de galería y marca portada cuando corresponda.',
      formAction: '/admin/hotels/room-images',
      submitLabel: 'Crear imagen',
      backHref: '/admin/hotels/room-images',
      fields: await this.imageFields(),
      values: { sortOrder: 0, isCover: false },
    })
  }

  async edit(ctx: HttpContext) {
    const row = await RoomImage.findOrFail(ctx.params.id)

    return renderCatalogForm(ctx, {
      formMode: 'edit',
      formKicker: 'Operación hotelera',
      formTitle: `Editar imagen #${row.id}`,
      formSubtitle: 'Actualiza URL, orden o portada de la imagen.',
      formAction: `/admin/hotels/room-images/${row.id}/update`,
      submitLabel: 'Guardar cambios',
      backHref: '/admin/hotels/room-images',
      fields: await this.imageFields(),
      values: {
        roomId: row.roomId,
        imageUrl: row.imageUrl,
        caption: row.caption,
        sortOrder: row.sortOrder,
        isCover: row.isCover,
      },
    })
  }

  async store(ctx: HttpContext) {
    const { request } = ctx
    const payload = await request.validateUsing(createRoomImageValidator)

    const room = await Room.find(payload.roomId)
    if (!room) {
      return respondConflictOrRedirect(ctx, 'roomId no existe', '/admin/hotels/room-images/new', 400)
    }

    const row = await RoomImage.create({
      roomId: payload.roomId,
      imageUrl: payload.imageUrl,
      caption: payload.caption ?? null,
      sortOrder: payload.sortOrder ?? 0,
      isCover: payload.isCover ?? false,
    })

    if (row.isCover) {
      await RoomImage.query().where('room_id', row.roomId).whereNot('id', row.id).update({ is_cover: 0 })
    }

    await AuditLogger.log(
      {
        action: 'CREATE',
        entity: 'room_image',
        entityId: row.id,
        oldValues: null,
        newValues: {
          roomId: row.roomId,
          imageUrl: row.imageUrl,
          sortOrder: row.sortOrder,
          isCover: row.isCover,
        },
        metadata: { source: 'admin.hotels.roomImages.store' },
      },
      ctx
    )

    return respondSuccessOrJson(ctx, 'Imagen de habitacion creada', '/admin/hotels/room-images', row, true)
  }

  async update(ctx: HttpContext) {
    const { params, request } = ctx
    const row = await RoomImage.findOrFail(params.id)
    const payload = await request.validateUsing(createRoomImageValidator)

    const room = await Room.find(payload.roomId)
    if (!room) {
      return respondConflictOrRedirect(ctx, 'roomId no existe', `/admin/hotels/room-images/${row.id}/edit`, 400)
    }

    const previous = {
      roomId: row.roomId,
      imageUrl: row.imageUrl,
      sortOrder: row.sortOrder,
      isCover: row.isCover,
    }

    row.roomId = payload.roomId
    row.imageUrl = payload.imageUrl
    row.caption = payload.caption ?? null
    row.sortOrder = payload.sortOrder ?? row.sortOrder
    row.isCover = payload.isCover ?? row.isCover
    await row.save()

    if (row.isCover) {
      await RoomImage.query().where('room_id', row.roomId).whereNot('id', row.id).update({ is_cover: 0 })
    }

    await AuditLogger.log(
      {
        action: 'UPDATE',
        entity: 'room_image',
        entityId: row.id,
        oldValues: previous,
        newValues: {
          roomId: row.roomId,
          imageUrl: row.imageUrl,
          sortOrder: row.sortOrder,
          isCover: row.isCover,
        },
        metadata: { source: 'admin.hotels.roomImages.update' },
      },
      ctx
    )

    return respondSuccessOrJson(ctx, 'Imagen de habitacion actualizada', '/admin/hotels/room-images', row)
  }
}
