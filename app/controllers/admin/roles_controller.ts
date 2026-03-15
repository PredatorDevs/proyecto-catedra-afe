import type { HttpContext } from '@adonisjs/core/http'
import Role from '#models/role'
import Permission from '#models/permission'
import AuditLogger from '#services/audit_logger'
import { createRoleValidator } from '#validators/admin/create_role_validator'

export default class RolesController {
  async index({ view }: HttpContext) {
    const roles = await Role.query().preload('permissions').orderBy('id', 'asc')
    const permissions = await Permission.query().orderBy('slug', 'asc')
    const rolesWithPermissions = roles.filter((role) => role.permissions.length > 0).length
    const rolesWithoutPermissions = roles.length - rolesWithPermissions

    return view.render('pages/admin/roles', {
      roles,
      roleStats: {
        totalRoles: roles.length,
        rolesWithPermissions,
        rolesWithoutPermissions,
        totalPermissions: permissions.length,
      },
    })
  }

  async create({ view }: HttpContext) {
    return view.render('pages/admin/roles_form', {
      formMode: 'create',
      formAction: '/admin/roles',
      formTitle: 'Crear rol',
      formSubtitle: 'Define slug y nombre para controlar grupos de permisos internos.',
      submitLabel: 'Crear rol',
      backHref: '/admin/roles',
      role: null,
    })
  }

  async edit({ params, view }: HttpContext) {
    const role = await Role.findOrFail(params.id)

    return view.render('pages/admin/roles_form', {
      formMode: 'edit',
      formAction: `/admin/roles/${role.id}/update`,
      formTitle: `Editar rol #${role.id}`,
      formSubtitle: 'Actualiza la identidad del rol para mantener una nomenclatura consistente.',
      submitLabel: 'Guardar cambios',
      backHref: '/admin/roles',
      role,
    })
  }

  async store(ctx: HttpContext) {
    const { request, response, session } = ctx
    const payload = await request.validateUsing(createRoleValidator)

    const role = await Role.create({
      slug: payload.slug,
      name: payload.name,
    })

    await AuditLogger.log(
      {
        action: 'CREATE',
        entity: 'role',
        entityId: role.id,
        metadata: { slug: role.slug, name: role.name },
      },
      ctx
    )

    session.flash('success', 'Rol creado correctamente')
    return response.redirect('/admin/roles')
  }

  async update(ctx: HttpContext) {
    const { params, request, response, session } = ctx
    const role = await Role.findOrFail(params.id)

    const slug = String(request.input('slug', '')).trim()
    const name = String(request.input('name', '')).trim()

    if (!slug || !name) {
      session.flash('error', 'Slug y nombre son obligatorios para actualizar el rol')
      return response.redirect(`/admin/roles/${role.id}/edit`)
    }

    const duplicate = await Role.query().where('slug', slug).whereNot('id', role.id).first()
    if (duplicate) {
      session.flash('error', `Ya existe otro rol con slug "${slug}"`)
      return response.redirect(`/admin/roles/${role.id}/edit`)
    }

    const previous = { slug: role.slug, name: role.name }

    role.slug = slug
    role.name = name
    await role.save()

    await AuditLogger.log(
      {
        action: 'UPDATE',
        entity: 'role',
        entityId: role.id,
        metadata: {
          previous,
          current: { slug: role.slug, name: role.name },
        },
      },
      ctx
    )

    session.flash('success', 'Rol actualizado correctamente')
    return response.redirect('/admin/roles')
  }

  async destroy(ctx: HttpContext) {
    const { params, response, session } = ctx
    const role = await Role.findOrFail(params.id)

    if (role.slug === 'admin') {
      session.flash('error', 'El rol admin no puede eliminarse')
      return response.redirect('/admin/roles')
    }

    const metadata = { slug: role.slug, name: role.name }
    await role.delete()

    await AuditLogger.log(
      {
        action: 'DELETE',
        entity: 'role',
        entityId: params.id,
        metadata,
      },
      ctx
    )

    session.flash('success', 'Rol eliminado correctamente')
    return response.redirect('/admin/roles')
  }

  async editPermissions({ params, view }: HttpContext) {
    const role = await Role.query().where('id', params.id).preload('permissions').firstOrFail()
    const permissions = await Permission.query().orderBy('slug', 'asc')

    const assignedPermissionIds = role.permissions.map((permission) => permission.id)

    return view.render('pages/admin/role_permissions', {
      role,
      permissions,
      assignedPermissionIds,
    })
  }

  async updatePermissions(ctx: HttpContext) {
    const { params, request, response, session } = ctx
    const role = await Role.query().where('id', params.id).preload('permissions').firstOrFail()

    const previousPermissionIds = role.permissions.map((permission) => permission.id)

    const rawPermissionIds = request.input('permissionIds')
    const selectedPermissionIds = Array.isArray(rawPermissionIds)
      ? rawPermissionIds
      : rawPermissionIds
        ? [rawPermissionIds]
        : []

    const permissionIds = selectedPermissionIds
      .map((value) => Number(value))
      .filter((value) => Number.isInteger(value) && value > 0)

    await role.related('permissions').sync(permissionIds)

    const added = permissionIds.filter((id) => !previousPermissionIds.includes(id))
    const removed = previousPermissionIds.filter((id) => !permissionIds.includes(id))

    await AuditLogger.log(
      {
        action: 'UPDATE',
        entity: 'role_permissions',
        entityId: role.id,
        metadata: {
          role: { id: role.id, slug: role.slug },
          previousPermissionIds,
          currentPermissionIds: permissionIds,
          added,
          removed,
        },
      },
      ctx
    )

    session.flash('success', 'Permisos del rol actualizados correctamente')
    return response.redirect(`/admin/roles/${role.id}/permissions`)
  }
}
