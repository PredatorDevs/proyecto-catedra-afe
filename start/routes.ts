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
      .use(middleware.auth())
      .use(middleware.shareAuth())

    router
      .get('/dashboard', async ({ view }) => view.render('pages/dashboard'))
      .use(middleware.auth())
      .use(middleware.shareAuth())

    router
      .get('/admin', async ({ view }) => view.render('pages/admin/index'))
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['admin.access'] }))
      .use(middleware.shareAuth())

    router
      .get('/admin/audit-logs', [AuditLogsController, 'index'])
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['audit_logs.read'] }))
      .use(middleware.shareAuth())

    router
      .get('/admin/users', [UsersController, 'index'])
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['users.read'] }))
      .use(middleware.shareAuth())

    router
      .post('/admin/users', [UsersController, 'store'])
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['users.manage'] }))
      .use(middleware.shareAuth())

    router
      .post('/admin/users/:id/update', [UsersController, 'update'])
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['users.manage'] }))
      .use(middleware.shareAuth())

    router
      .get('/admin/roles', [RolesController, 'index'])
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['roles.read'] }))
      .use(middleware.shareAuth())

    router
      .post('/admin/roles', [RolesController, 'store'])
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['roles.manage'] }))
      .use(middleware.shareAuth())

    router
      .post('/admin/roles/:id/update', [RolesController, 'update'])
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['roles.manage'] }))
      .use(middleware.shareAuth())

    router
      .post('/admin/roles/:id/delete', [RolesController, 'destroy'])
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['roles.manage'] }))
      .use(middleware.shareAuth())

    router
      .get('/admin/roles/:id/permissions', [RolesController, 'editPermissions'])
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['roles.manage'] }))
      .use(middleware.shareAuth())

    router
      .post('/admin/roles/:id/permissions', [RolesController, 'updatePermissions'])
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['roles.manage'] }))
      .use(middleware.shareAuth())

    router
      .get('/admin/permissions', [PermissionsController, 'index'])
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['permissions.read'] }))
      .use(middleware.shareAuth())

    router
      .post('/admin/permissions', [PermissionsController, 'store'])
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['permissions.manage'] }))
      .use(middleware.shareAuth())

    router
      .post('/admin/permissions/:id/update', [PermissionsController, 'update'])
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['permissions.manage'] }))
      .use(middleware.shareAuth())

    router
      .post('/admin/permissions/:id/delete', [PermissionsController, 'destroy'])
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['permissions.manage'] }))
      .use(middleware.shareAuth())

    router.get('/login', [AuthController, 'showLogin']).use(middleware.guest())

    router.post('/login', [AuthController, 'login']).use(middleware.guest())

    router.post('/logout', [AuthController, 'logout']).use(middleware.auth())
  })