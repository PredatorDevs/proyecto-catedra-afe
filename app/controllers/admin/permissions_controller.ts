import type { HttpContext } from '@adonisjs/core/http'
import Permission from '#models/permission'
import Role from '#models/role'
import AuditLogger from '#services/audit_logger'
import { createPermissionValidator } from '#validators/admin/create_permission_validator'

export default class PermissionsController {
  async index({ view }: HttpContext) {
    const permissions = await Permission.query().preload('roles').orderBy('id', 'asc')
    const roles = await Role.query().orderBy('slug', 'asc')
    const permissionsWithRoles = permissions.filter((permission) => permission.roles.length > 0).length
    const permissionsWithoutRoles = permissions.length - permissionsWithRoles

    return view.render('pages/admin/permissions', {
      permissions,
      permissionStats: {
        totalPermissions: permissions.length,
        permissionsWithRoles,
        permissionsWithoutRoles,
        totalRoles: roles.length,
      },
    })
  }

  async create({ view }: HttpContext) {
    return view.render('pages/admin/permissions_form', {
      formMode: 'create',
      formAction: '/admin/permissions',
      formTitle: 'Crear permiso',
      formSubtitle: 'Define capacidades granulares para controlar acceso a funciones del sistema.',
      submitLabel: 'Crear permiso',
      backHref: '/admin/permissions',
      permission: null,
    })
  }

  async edit({ params, view }: HttpContext) {
    const permission = await Permission.findOrFail(params.id)

    return view.render('pages/admin/permissions_form', {
      formMode: 'edit',
      formAction: `/admin/permissions/${permission.id}/update`,
      formTitle: `Editar permiso #${permission.id}`,
      formSubtitle: 'Actualiza slug y nombre para mantener una matriz de autorización clara.',
      submitLabel: 'Guardar cambios',
      backHref: '/admin/permissions',
      permission,
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
        oldValues: null,
        newValues: { slug: permission.slug, name: permission.name },
        metadata: { source: 'admin.permissions.store' },
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
      return response.redirect(`/admin/permissions/${permission.id}/edit`)
    }

    const duplicate = await Permission.query().where('slug', slug).whereNot('id', permission.id).first()
    if (duplicate) {
      session.flash('error', `Ya existe otro permiso con slug "${slug}"`)
      return response.redirect(`/admin/permissions/${permission.id}/edit`)
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
        oldValues: previous,
        newValues: { slug: permission.slug, name: permission.name },
        metadata: {
          source: 'admin.permissions.update',
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

    const previous = { slug: permission.slug, name: permission.name }
    await permission.delete()

    await AuditLogger.log(
      {
        action: 'DELETE',
        entity: 'permission',
        entityId: params.id,
        oldValues: previous,
        newValues: null,
        metadata: { source: 'admin.permissions.destroy' },
      },
      ctx
    )

    session.flash('success', 'Permiso eliminado correctamente')
    return response.redirect('/admin/permissions')
  }
}
