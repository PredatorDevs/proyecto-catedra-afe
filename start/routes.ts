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
import HotelsIndexController from '#controllers/admin/hotels/index_controller'
import RoomTypesController from '#controllers/admin/hotels/room_types_controller'
import RoomsController from '#controllers/admin/hotels/rooms_controller'
import SeasonsController from '#controllers/admin/hotels/seasons_controller'
import AdditionalChargeCatalogController from '#controllers/admin/hotels/additional_charge_catalog_controller'
import CustomersController from '#controllers/admin/hotels/customers_controller'
import RoomImagesController from '#controllers/admin/hotels/room_images_controller'
import RoomPricesController from '#controllers/admin/hotels/room_prices_controller'

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

    router
      .get('/admin/hotels', [HotelsIndexController, 'index'])
      .as('admin.hotels.index')
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['admin.access'] }))
      .use(middleware.shareAuth())

    router
      .get('/admin/hotels/room-types', [RoomTypesController, 'index'])
      .as('admin.hotels.roomTypes.index')
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['admin.access'] }))
      .use(middleware.shareAuth())

    router
      .get('/admin/hotels/room-types/new', [RoomTypesController, 'create'])
      .as('admin.hotels.roomTypes.create')
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['admin.access'] }))
      .use(middleware.shareAuth())

    router
      .get('/admin/hotels/room-types/:id/edit', [RoomTypesController, 'edit'])
      .as('admin.hotels.roomTypes.edit')
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['admin.access'] }))
      .use(middleware.shareAuth())

    router
      .post('/admin/hotels/room-types', [RoomTypesController, 'store'])
      .as('admin.hotels.roomTypes.store')
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['admin.access'] }))
      .use(middleware.shareAuth())

    router
      .post('/admin/hotels/room-types/:id/update', [RoomTypesController, 'update'])
      .as('admin.hotels.roomTypes.update')
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['admin.access'] }))
      .use(middleware.shareAuth())

    router
      .get('/admin/hotels/rooms', [RoomsController, 'index'])
      .as('admin.hotels.rooms.index')
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['admin.access'] }))
      .use(middleware.shareAuth())

    router
      .get('/admin/hotels/rooms/new', [RoomsController, 'create'])
      .as('admin.hotels.rooms.create')
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['admin.access'] }))
      .use(middleware.shareAuth())

    router
      .get('/admin/hotels/rooms/:id/edit', [RoomsController, 'edit'])
      .as('admin.hotels.rooms.edit')
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['admin.access'] }))
      .use(middleware.shareAuth())

    router
      .post('/admin/hotels/rooms', [RoomsController, 'store'])
      .as('admin.hotels.rooms.store')
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['admin.access'] }))
      .use(middleware.shareAuth())

    router
      .post('/admin/hotels/rooms/:id/update', [RoomsController, 'update'])
      .as('admin.hotels.rooms.update')
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['admin.access'] }))
      .use(middleware.shareAuth())

    router
      .get('/admin/hotels/seasons', [SeasonsController, 'index'])
      .as('admin.hotels.seasons.index')
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['admin.access'] }))
      .use(middleware.shareAuth())

    router
      .get('/admin/hotels/seasons/new', [SeasonsController, 'create'])
      .as('admin.hotels.seasons.create')
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['admin.access'] }))
      .use(middleware.shareAuth())

    router
      .get('/admin/hotels/seasons/:id/edit', [SeasonsController, 'edit'])
      .as('admin.hotels.seasons.edit')
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['admin.access'] }))
      .use(middleware.shareAuth())

    router
      .post('/admin/hotels/seasons', [SeasonsController, 'store'])
      .as('admin.hotels.seasons.store')
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['admin.access'] }))
      .use(middleware.shareAuth())

    router
      .post('/admin/hotels/seasons/:id/update', [SeasonsController, 'update'])
      .as('admin.hotels.seasons.update')
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['admin.access'] }))
      .use(middleware.shareAuth())

    router
      .get('/admin/hotels/additional-charges', [AdditionalChargeCatalogController, 'index'])
      .as('admin.hotels.additionalCharges.index')
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['admin.access'] }))
      .use(middleware.shareAuth())

    router
      .get('/admin/hotels/additional-charges/new', [AdditionalChargeCatalogController, 'create'])
      .as('admin.hotels.additionalCharges.create')
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['admin.access'] }))
      .use(middleware.shareAuth())

    router
      .get('/admin/hotels/additional-charges/:id/edit', [AdditionalChargeCatalogController, 'edit'])
      .as('admin.hotels.additionalCharges.edit')
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['admin.access'] }))
      .use(middleware.shareAuth())

    router
      .post('/admin/hotels/additional-charges', [AdditionalChargeCatalogController, 'store'])
      .as('admin.hotels.additionalCharges.store')
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['admin.access'] }))
      .use(middleware.shareAuth())

    router
      .post('/admin/hotels/additional-charges/:id/update', [AdditionalChargeCatalogController, 'update'])
      .as('admin.hotels.additionalCharges.update')
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['admin.access'] }))
      .use(middleware.shareAuth())

    router
      .get('/admin/hotels/customers', [CustomersController, 'index'])
      .as('admin.hotels.customers.index')
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['admin.access'] }))
      .use(middleware.shareAuth())

    router
      .get('/admin/hotels/customers/new', [CustomersController, 'create'])
      .as('admin.hotels.customers.create')
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['admin.access'] }))
      .use(middleware.shareAuth())

    router
      .get('/admin/hotels/customers/:id/edit', [CustomersController, 'edit'])
      .as('admin.hotels.customers.edit')
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['admin.access'] }))
      .use(middleware.shareAuth())

    router
      .post('/admin/hotels/customers', [CustomersController, 'store'])
      .as('admin.hotels.customers.store')
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['admin.access'] }))
      .use(middleware.shareAuth())

    router
      .post('/admin/hotels/customers/:id/update', [CustomersController, 'update'])
      .as('admin.hotels.customers.update')
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['admin.access'] }))
      .use(middleware.shareAuth())

    router
      .get('/admin/hotels/room-images', [RoomImagesController, 'index'])
      .as('admin.hotels.roomImages.index')
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['admin.access'] }))
      .use(middleware.shareAuth())

    router
      .get('/admin/hotels/room-images/new', [RoomImagesController, 'create'])
      .as('admin.hotels.roomImages.create')
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['admin.access'] }))
      .use(middleware.shareAuth())

    router
      .get('/admin/hotels/room-images/:id/edit', [RoomImagesController, 'edit'])
      .as('admin.hotels.roomImages.edit')
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['admin.access'] }))
      .use(middleware.shareAuth())

    router
      .post('/admin/hotels/room-images', [RoomImagesController, 'store'])
      .as('admin.hotels.roomImages.store')
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['admin.access'] }))
      .use(middleware.shareAuth())

    router
      .post('/admin/hotels/room-images/:id/update', [RoomImagesController, 'update'])
      .as('admin.hotels.roomImages.update')
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['admin.access'] }))
      .use(middleware.shareAuth())

    router
      .get('/admin/hotels/room-prices', [RoomPricesController, 'index'])
      .as('admin.hotels.roomPrices.index')
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['admin.access'] }))
      .use(middleware.shareAuth())

    router
      .get('/admin/hotels/room-prices/new', [RoomPricesController, 'create'])
      .as('admin.hotels.roomPrices.create')
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['admin.access'] }))
      .use(middleware.shareAuth())

    router
      .get('/admin/hotels/room-prices/:id/edit', [RoomPricesController, 'edit'])
      .as('admin.hotels.roomPrices.edit')
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['admin.access'] }))
      .use(middleware.shareAuth())

    router
      .post('/admin/hotels/room-prices', [RoomPricesController, 'store'])
      .as('admin.hotels.roomPrices.store')
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['admin.access'] }))
      .use(middleware.shareAuth())

    router
      .post('/admin/hotels/room-prices/:id/update', [RoomPricesController, 'update'])
      .as('admin.hotels.roomPrices.update')
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['admin.access'] }))
      .use(middleware.shareAuth())

    router.get('/login', [AuthController, 'showLogin']).as('auth.login').use(middleware.guest())

    router.post('/login', [AuthController, 'login']).as('auth.login.submit').use(middleware.guest())

    router.post('/logout', [AuthController, 'logout']).as('auth.logout').use(middleware.auth())
  })