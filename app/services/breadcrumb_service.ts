import router from '@adonisjs/core/services/router'

export type BreadcrumbItem = {
  label: string
  href?: string
  current?: boolean
}

type BreadcrumbDefinitionItem = {
  label: string
  href?: string
  routeName?: string
}

type BreadcrumbDefinition = BreadcrumbDefinitionItem[]

const ROOT_LABEL = 'Inicio'

function normalizePath(path: string) {
  const cleanPath = path.split('?')[0].trim()

  if (!cleanPath || cleanPath === '/') {
    return '/'
  }

  return cleanPath.endsWith('/') ? cleanPath.slice(0, -1) : cleanPath
}

function finalize(items: BreadcrumbItem[]) {
  return items.map((item, index) => {
    const isCurrent = index === items.length - 1

    return {
      ...item,
      href: isCurrent ? undefined : item.href,
      current: isCurrent,
    }
  })
}

function resolveHref(item: BreadcrumbDefinitionItem) {
  if (item.href) {
    return item.href
  }

  if (!item.routeName) {
    return undefined
  }

  try {
    return router.makeUrl(item.routeName)
  } catch {
    return undefined
  }
}

function finalizeDefinition(items: BreadcrumbDefinition) {
  return finalize(
    items.map((item) => ({
      label: item.label,
      href: resolveHref(item),
    }))
  )
}

const namedBreadcrumbs: Record<string, BreadcrumbDefinition> = {
  home: [{ label: ROOT_LABEL, routeName: 'home' }],
  dashboard: [
    { label: ROOT_LABEL, routeName: 'home' },
    { label: 'Dashboard', routeName: 'dashboard' },
  ],
  'admin.index': [
    { label: ROOT_LABEL, routeName: 'home' },
    { label: 'Administracion', routeName: 'admin.index' },
  ],
  'admin.users.index': [
    { label: ROOT_LABEL, routeName: 'home' },
    { label: 'Administracion', routeName: 'admin.index' },
    { label: 'Usuarios', routeName: 'admin.users.index' },
  ],
  'admin.users.create': [
    { label: ROOT_LABEL, routeName: 'home' },
    { label: 'Administracion', routeName: 'admin.index' },
    { label: 'Usuarios', routeName: 'admin.users.index' },
    { label: 'Nuevo usuario' },
  ],
  'admin.users.edit': [
    { label: ROOT_LABEL, routeName: 'home' },
    { label: 'Administracion', routeName: 'admin.index' },
    { label: 'Usuarios', routeName: 'admin.users.index' },
    { label: 'Editar usuario' },
  ],
  'admin.roles.index': [
    { label: ROOT_LABEL, routeName: 'home' },
    { label: 'Administracion', routeName: 'admin.index' },
    { label: 'Roles', routeName: 'admin.roles.index' },
  ],
  'admin.roles.create': [
    { label: ROOT_LABEL, routeName: 'home' },
    { label: 'Administracion', routeName: 'admin.index' },
    { label: 'Roles', routeName: 'admin.roles.index' },
    { label: 'Nuevo rol' },
  ],
  'admin.roles.edit': [
    { label: ROOT_LABEL, routeName: 'home' },
    { label: 'Administracion', routeName: 'admin.index' },
    { label: 'Roles', routeName: 'admin.roles.index' },
    { label: 'Editar rol' },
  ],
  'admin.roles.permissions.edit': [
    { label: ROOT_LABEL, routeName: 'home' },
    { label: 'Administracion', routeName: 'admin.index' },
    { label: 'Roles', routeName: 'admin.roles.index' },
    { label: 'Permisos del Rol' },
  ],
  'admin.permissions.index': [
    { label: ROOT_LABEL, routeName: 'home' },
    { label: 'Administracion', routeName: 'admin.index' },
    { label: 'Permisos', routeName: 'admin.permissions.index' },
  ],
  'admin.permissions.create': [
    { label: ROOT_LABEL, routeName: 'home' },
    { label: 'Administracion', routeName: 'admin.index' },
    { label: 'Permisos', routeName: 'admin.permissions.index' },
    { label: 'Nuevo permiso' },
  ],
  'admin.permissions.edit': [
    { label: ROOT_LABEL, routeName: 'home' },
    { label: 'Administracion', routeName: 'admin.index' },
    { label: 'Permisos', routeName: 'admin.permissions.index' },
    { label: 'Editar permiso' },
  ],
  'admin.auditLogs.index': [
    { label: ROOT_LABEL, routeName: 'home' },
    { label: 'Administracion', routeName: 'admin.index' },
    { label: 'Audit Logs', routeName: 'admin.auditLogs.index' },
  ],
  'admin.hotels.index': [
    { label: ROOT_LABEL, routeName: 'home' },
    { label: 'Administracion', routeName: 'admin.index' },
    { label: 'Hoteles', routeName: 'admin.hotels.index' },
  ],
  'admin.hotels.customers.index': [
    { label: ROOT_LABEL, routeName: 'home' },
    { label: 'Administracion', routeName: 'admin.index' },
    { label: 'Hoteles', routeName: 'admin.hotels.index' },
    { label: 'Clientes', routeName: 'admin.hotels.customers.index' },
  ],
  'admin.hotels.customers.create': [
    { label: ROOT_LABEL, routeName: 'home' },
    { label: 'Administracion', routeName: 'admin.index' },
    { label: 'Hoteles', routeName: 'admin.hotels.index' },
    { label: 'Clientes', routeName: 'admin.hotels.customers.index' },
    { label: 'Nuevo cliente' },
  ],
  'admin.hotels.customers.edit': [
    { label: ROOT_LABEL, routeName: 'home' },
    { label: 'Administracion', routeName: 'admin.index' },
    { label: 'Hoteles', routeName: 'admin.hotels.index' },
    { label: 'Clientes', routeName: 'admin.hotels.customers.index' },
    { label: 'Editar cliente' },
  ],
  'admin.hotels.roomTypes.index': [
    { label: ROOT_LABEL, routeName: 'home' },
    { label: 'Administracion', routeName: 'admin.index' },
    { label: 'Hoteles', routeName: 'admin.hotels.index' },
    { label: 'Tipos de habitacion', routeName: 'admin.hotels.roomTypes.index' },
  ],
  'admin.hotels.roomTypes.create': [
    { label: ROOT_LABEL, routeName: 'home' },
    { label: 'Administracion', routeName: 'admin.index' },
    { label: 'Hoteles', routeName: 'admin.hotels.index' },
    { label: 'Tipos de habitacion', routeName: 'admin.hotels.roomTypes.index' },
    { label: 'Nuevo tipo' },
  ],
  'admin.hotels.roomTypes.edit': [
    { label: ROOT_LABEL, routeName: 'home' },
    { label: 'Administracion', routeName: 'admin.index' },
    { label: 'Hoteles', routeName: 'admin.hotels.index' },
    { label: 'Tipos de habitacion', routeName: 'admin.hotels.roomTypes.index' },
    { label: 'Editar tipo' },
  ],
  'admin.hotels.rooms.index': [
    { label: ROOT_LABEL, routeName: 'home' },
    { label: 'Administracion', routeName: 'admin.index' },
    { label: 'Hoteles', routeName: 'admin.hotels.index' },
    { label: 'Habitaciones', routeName: 'admin.hotels.rooms.index' },
  ],
  'admin.hotels.rooms.create': [
    { label: ROOT_LABEL, routeName: 'home' },
    { label: 'Administracion', routeName: 'admin.index' },
    { label: 'Hoteles', routeName: 'admin.hotels.index' },
    { label: 'Habitaciones', routeName: 'admin.hotels.rooms.index' },
    { label: 'Nueva habitacion' },
  ],
  'admin.hotels.rooms.edit': [
    { label: ROOT_LABEL, routeName: 'home' },
    { label: 'Administracion', routeName: 'admin.index' },
    { label: 'Hoteles', routeName: 'admin.hotels.index' },
    { label: 'Habitaciones', routeName: 'admin.hotels.rooms.index' },
    { label: 'Editar habitacion' },
  ],
  'admin.hotels.roomImages.index': [
    { label: ROOT_LABEL, routeName: 'home' },
    { label: 'Administracion', routeName: 'admin.index' },
    { label: 'Hoteles', routeName: 'admin.hotels.index' },
    { label: 'Imagenes', routeName: 'admin.hotels.roomImages.index' },
  ],
  'admin.hotels.roomImages.create': [
    { label: ROOT_LABEL, routeName: 'home' },
    { label: 'Administracion', routeName: 'admin.index' },
    { label: 'Hoteles', routeName: 'admin.hotels.index' },
    { label: 'Imagenes', routeName: 'admin.hotels.roomImages.index' },
    { label: 'Nueva imagen' },
  ],
  'admin.hotels.roomImages.edit': [
    { label: ROOT_LABEL, routeName: 'home' },
    { label: 'Administracion', routeName: 'admin.index' },
    { label: 'Hoteles', routeName: 'admin.hotels.index' },
    { label: 'Imagenes', routeName: 'admin.hotels.roomImages.index' },
    { label: 'Editar imagen' },
  ],
  'admin.hotels.seasons.index': [
    { label: ROOT_LABEL, routeName: 'home' },
    { label: 'Administracion', routeName: 'admin.index' },
    { label: 'Hoteles', routeName: 'admin.hotels.index' },
    { label: 'Temporadas', routeName: 'admin.hotels.seasons.index' },
  ],
  'admin.hotels.seasons.create': [
    { label: ROOT_LABEL, routeName: 'home' },
    { label: 'Administracion', routeName: 'admin.index' },
    { label: 'Hoteles', routeName: 'admin.hotels.index' },
    { label: 'Temporadas', routeName: 'admin.hotels.seasons.index' },
    { label: 'Nueva temporada' },
  ],
  'admin.hotels.seasons.edit': [
    { label: ROOT_LABEL, routeName: 'home' },
    { label: 'Administracion', routeName: 'admin.index' },
    { label: 'Hoteles', routeName: 'admin.hotels.index' },
    { label: 'Temporadas', routeName: 'admin.hotels.seasons.index' },
    { label: 'Editar temporada' },
  ],
  'admin.hotels.roomPrices.index': [
    { label: ROOT_LABEL, routeName: 'home' },
    { label: 'Administracion', routeName: 'admin.index' },
    { label: 'Hoteles', routeName: 'admin.hotels.index' },
    { label: 'Tarifas', routeName: 'admin.hotels.roomPrices.index' },
  ],
  'admin.hotels.roomPrices.create': [
    { label: ROOT_LABEL, routeName: 'home' },
    { label: 'Administracion', routeName: 'admin.index' },
    { label: 'Hoteles', routeName: 'admin.hotels.index' },
    { label: 'Tarifas', routeName: 'admin.hotels.roomPrices.index' },
    { label: 'Nueva tarifa' },
  ],
  'admin.hotels.roomPrices.edit': [
    { label: ROOT_LABEL, routeName: 'home' },
    { label: 'Administracion', routeName: 'admin.index' },
    { label: 'Hoteles', routeName: 'admin.hotels.index' },
    { label: 'Tarifas', routeName: 'admin.hotels.roomPrices.index' },
    { label: 'Editar tarifa' },
  ],
  'admin.hotels.additionalCharges.index': [
    { label: ROOT_LABEL, routeName: 'home' },
    { label: 'Administracion', routeName: 'admin.index' },
    { label: 'Hoteles', routeName: 'admin.hotels.index' },
    { label: 'Cargos adicionales', routeName: 'admin.hotels.additionalCharges.index' },
  ],
  'admin.hotels.additionalCharges.create': [
    { label: ROOT_LABEL, routeName: 'home' },
    { label: 'Administracion', routeName: 'admin.index' },
    { label: 'Hoteles', routeName: 'admin.hotels.index' },
    { label: 'Cargos adicionales', routeName: 'admin.hotels.additionalCharges.index' },
    { label: 'Nuevo cargo' },
  ],
  'admin.hotels.additionalCharges.edit': [
    { label: ROOT_LABEL, routeName: 'home' },
    { label: 'Administracion', routeName: 'admin.index' },
    { label: 'Hoteles', routeName: 'admin.hotels.index' },
    { label: 'Cargos adicionales', routeName: 'admin.hotels.additionalCharges.index' },
    { label: 'Editar cargo' },
  ],
}

export default class BreadcrumbService {
  static build(path: string, routeName?: string): BreadcrumbItem[] {
    if (routeName && namedBreadcrumbs[routeName]) {
      return finalizeDefinition(namedBreadcrumbs[routeName])
    }

    const pathname = normalizePath(path)

    if (pathname === '/') {
      return finalize([{ label: ROOT_LABEL, href: '/' }])
    }

    if (pathname === '/dashboard') {
      return finalize([
        { label: ROOT_LABEL, href: '/' },
        { label: 'Dashboard', href: '/dashboard' },
      ])
    }

    if (pathname === '/admin') {
      return finalize([
        { label: ROOT_LABEL, href: '/' },
        { label: 'Administracion', href: '/admin' },
      ])
    }

    if (pathname === '/admin/users') {
      return finalize([
        { label: ROOT_LABEL, href: '/' },
        { label: 'Administracion', href: '/admin' },
        { label: 'Usuarios', href: '/admin/users' },
      ])
    }

    if (pathname === '/admin/roles') {
      return finalize([
        { label: ROOT_LABEL, href: '/' },
        { label: 'Administracion', href: '/admin' },
        { label: 'Roles', href: '/admin/roles' },
      ])
    }

    if (pathname === '/admin/permissions') {
      return finalize([
        { label: ROOT_LABEL, href: '/' },
        { label: 'Administracion', href: '/admin' },
        { label: 'Permisos', href: '/admin/permissions' },
      ])
    }

    if (pathname === '/admin/audit-logs') {
      return finalize([
        { label: ROOT_LABEL, href: '/' },
        { label: 'Administracion', href: '/admin' },
        { label: 'Audit Logs', href: '/admin/audit-logs' },
      ])
    }

    if (/^\/admin\/roles\/[^/]+\/permissions$/.test(pathname)) {
      return finalize([
        { label: ROOT_LABEL, href: '/' },
        { label: 'Administracion', href: '/admin' },
        { label: 'Roles', href: '/admin/roles' },
        { label: 'Permisos del Rol' },
      ])
    }

    if (pathname.startsWith('/admin')) {
      return finalize([
        { label: ROOT_LABEL, href: '/' },
        { label: 'Administracion', href: '/admin' },
      ])
    }

    return finalize([
      { label: ROOT_LABEL, href: '/' },
      { label: 'Seccion actual' },
    ])
  }
}
