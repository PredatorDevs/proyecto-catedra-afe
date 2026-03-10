import type { HttpContext } from '@adonisjs/core/http'
import Permission from '#models/permission'
import AuditLogger from '#services/audit_logger'
import { createPermissionValidator } from '#validators/admin/create_permission_validator'

export default class PermissionsController {
  async index({ view }: HttpContext) {
    const permissions = await Permission.query().preload('roles').orderBy('id', 'asc')

    return view.render('pages/admin/permissions', {
      permissions,
    })
  }

  async store(ctx: HttpContext) {
    const { request, response, session } = ctx
    const payload = await request.validateUsing(createPermissionValidator)

    const permission = await Permission.create({
      slug: payload.slug,
      name: payload.name,
    })

    await AuditLogger.log(
      {
        action: 'CREATE',
        entity: 'permission',
        entityId: permission.id,
        metadata: { slug: permission.slug, name: permission.name },
      },
      ctx
    )

    session.flash('success', 'Permiso creado correctamente')
    return response.redirect('/admin/permissions')
  }

  async update(ctx: HttpContext) {
    const { params, request, response, session } = ctx
    const permission = await Permission.findOrFail(params.id)

    const slug = String(request.input('slug', '')).trim()
    const name = String(request.input('name', '')).trim()

    if (!slug || !name) {
      session.flash('error', 'Slug y nombre son obligatorios para actualizar el permiso')
      return response.redirect('/admin/permissions')
    }

    const duplicate = await Permission.query().where('slug', slug).whereNot('id', permission.id).first()
    if (duplicate) {
      session.flash('error', `Ya existe otro permiso con slug "${slug}"`)
      return response.redirect('/admin/permissions')
    }

    const previous = { slug: permission.slug, name: permission.name }

    permission.slug = slug
    permission.name = name
    await permission.save()

    await AuditLogger.log(
      {
        action: 'UPDATE',
        entity: 'permission',
        entityId: permission.id,
        metadata: {
          previous,
          current: { slug: permission.slug, name: permission.name },
        },
      },
      ctx
    )

    session.flash('success', 'Permiso actualizado correctamente')
    return response.redirect('/admin/permissions')
  }

  async destroy(ctx: HttpContext) {
    const { params, response, session } = ctx
    const permission = await Permission.findOrFail(params.id)

    const protectedSlugs = ['admin.access', 'roles.manage', 'permissions.manage']
    if (protectedSlugs.includes(permission.slug)) {
      session.flash('error', `El permiso ${permission.slug} no puede eliminarse`)
      return response.redirect('/admin/permissions')
    }

    const metadata = { slug: permission.slug, name: permission.name }
    await permission.delete()

    await AuditLogger.log(
      {
        action: 'DELETE',
        entity: 'permission',
        entityId: params.id,
        metadata,
      },
      ctx
    )

    session.flash('success', 'Permiso eliminado correctamente')
    return response.redirect('/admin/permissions')
  }
}
