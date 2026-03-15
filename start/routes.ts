/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'
import AuthController from '#controllers/auth_controller'
import AuditLogsController from '#controllers/admin/audit_logs_controller'
import UsersController from '#controllers/admin/users_controller'
import RolesController from '#controllers/admin/roles_controller'
import PermissionsController from '#controllers/admin/permissions_controller'

router
  .group(() => {
    router
      .get('/', async ({ view }) => view.render('pages/home'))
      .as('home')
      .use(middleware.auth())
      .use(middleware.shareAuth())

    router
      .get('/dashboard', async ({ view }) => view.render('pages/dashboard'))
      .as('dashboard')
      .use(middleware.auth())
      .use(middleware.shareAuth())

    router
      .get('/admin', async ({ view }) => view.render('pages/admin/index'))
      .as('admin.index')
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['admin.access'] }))
      .use(middleware.shareAuth())

    router
      .get('/admin/audit-logs', [AuditLogsController, 'index'])
      .as('admin.auditLogs.index')
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['audit_logs.read'] }))
      .use(middleware.shareAuth())

    router
      .get('/admin/users', [UsersController, 'index'])
      .as('admin.users.index')
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['users.read'] }))
      .use(middleware.shareAuth())

    router
      .get('/admin/users/new', [UsersController, 'create'])
      .as('admin.users.create')
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['users.manage'] }))
      .use(middleware.shareAuth())

    router
      .get('/admin/users/:id/edit', [UsersController, 'edit'])
      .as('admin.users.edit')
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['users.manage'] }))
      .use(middleware.shareAuth())

    router
      .post('/admin/users', [UsersController, 'store'])
      .as('admin.users.store')
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['users.manage'] }))
      .use(middleware.shareAuth())

    router
      .post('/admin/users/:id/update', [UsersController, 'update'])
      .as('admin.users.update')
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['users.manage'] }))
      .use(middleware.shareAuth())

    router
      .get('/admin/roles', [RolesController, 'index'])
      .as('admin.roles.index')
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['roles.read'] }))
      .use(middleware.shareAuth())

    router
      .get('/admin/roles/new', [RolesController, 'create'])
      .as('admin.roles.create')
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['roles.manage'] }))
      .use(middleware.shareAuth())

    router
      .get('/admin/roles/:id/edit', [RolesController, 'edit'])
      .as('admin.roles.edit')
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['roles.manage'] }))
      .use(middleware.shareAuth())

    router
      .post('/admin/roles', [RolesController, 'store'])
      .as('admin.roles.store')
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['roles.manage'] }))
      .use(middleware.shareAuth())

    router
      .post('/admin/roles/:id/update', [RolesController, 'update'])
      .as('admin.roles.update')
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['roles.manage'] }))
      .use(middleware.shareAuth())

    router
      .post('/admin/roles/:id/delete', [RolesController, 'destroy'])
      .as('admin.roles.delete')
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['roles.manage'] }))
      .use(middleware.shareAuth())

    router
      .get('/admin/roles/:id/permissions', [RolesController, 'editPermissions'])
      .as('admin.roles.permissions.edit')
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['roles.manage'] }))
      .use(middleware.shareAuth())

    router
      .post('/admin/roles/:id/permissions', [RolesController, 'updatePermissions'])
      .as('admin.roles.permissions.update')
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['roles.manage'] }))
      .use(middleware.shareAuth())

    router
      .get('/admin/permissions', [PermissionsController, 'index'])
      .as('admin.permissions.index')
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['permissions.read'] }))
      .use(middleware.shareAuth())

    router
      .get('/admin/permissions/new', [PermissionsController, 'create'])
      .as('admin.permissions.create')
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['permissions.manage'] }))
      .use(middleware.shareAuth())

    router
      .get('/admin/permissions/:id/edit', [PermissionsController, 'edit'])
      .as('admin.permissions.edit')
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['permissions.manage'] }))
      .use(middleware.shareAuth())

    router
      .post('/admin/permissions', [PermissionsController, 'store'])
      .as('admin.permissions.store')
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['permissions.manage'] }))
      .use(middleware.shareAuth())

    router
      .post('/admin/permissions/:id/update', [PermissionsController, 'update'])
      .as('admin.permissions.update')
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['permissions.manage'] }))
      .use(middleware.shareAuth())

    router
      .post('/admin/permissions/:id/delete', [PermissionsController, 'destroy'])
      .as('admin.permissions.delete')
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['permissions.manage'] }))
      .use(middleware.shareAuth())

    router.get('/login', [AuthController, 'showLogin']).as('auth.login').use(middleware.guest())

    router.post('/login', [AuthController, 'login']).as('auth.login.submit').use(middleware.guest())

    router.post('/logout', [AuthController, 'logout']).as('auth.logout').use(middleware.auth())
  })