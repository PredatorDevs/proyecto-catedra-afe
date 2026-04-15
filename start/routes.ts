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
import ReservationsController from '#controllers/admin/hotels/reservations_controller'
import ReservationGuestsController from '#controllers/admin/hotels/reservation_guests_controller'
import CheckinCheckoutLogsController from '#controllers/admin/hotels/checkin_checkout_logs_controller'
import ReservationChargesController from '#controllers/admin/hotels/reservation_charges_controller'
import PaymentMethodsController from '#controllers/admin/hotels/payment_methods_controller'
import CashierShiftsController from '#controllers/admin/hotels/cashier_shifts_controller'
import PaymentsController from '#controllers/admin/hotels/payments_controller'
import FiscalDocumentsController from '#controllers/admin/hotels/fiscal_documents_controller'
import PaymentProofsController from '#controllers/admin/hotels/payment_proofs_controller'
import PaymentTransactionsController from '#controllers/admin/hotels/payment_transactions_controller'
import PaymentReservationAllocationsController from '#controllers/admin/hotels/payment_reservation_allocations_controller'
import PaymentChargeAllocationsController from '#controllers/admin/hotels/payment_charge_allocations_controller'

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

    router
      .get('/admin/hotels/reservations', [ReservationsController, 'index'])
      .as('admin.hotels.reservations.index')
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['admin.access'] }))
      .use(middleware.shareAuth())

    router
      .get('/admin/hotels/reservations/new', [ReservationsController, 'create'])
      .as('admin.hotels.reservations.create')
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['admin.access'] }))
      .use(middleware.shareAuth())

    router
      .get('/admin/hotels/reservations/:id/edit', [ReservationsController, 'edit'])
      .as('admin.hotels.reservations.edit')
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['admin.access'] }))
      .use(middleware.shareAuth())

    router
      .post('/admin/hotels/reservations', [ReservationsController, 'store'])
      .as('admin.hotels.reservations.store')
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['admin.access'] }))
      .use(middleware.shareAuth())

    router
      .post('/admin/hotels/reservations/:id/update', [ReservationsController, 'update'])
      .as('admin.hotels.reservations.update')
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['admin.access'] }))
      .use(middleware.shareAuth())

    router
      .get('/admin/hotels/reservation-guests', [ReservationGuestsController, 'index'])
      .as('admin.hotels.reservationGuests.index')
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['admin.access'] }))
      .use(middleware.shareAuth())

    router
      .get('/admin/hotels/reservation-guests/new', [ReservationGuestsController, 'create'])
      .as('admin.hotels.reservationGuests.create')
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['admin.access'] }))
      .use(middleware.shareAuth())

    router
      .get('/admin/hotels/reservation-guests/:id/edit', [ReservationGuestsController, 'edit'])
      .as('admin.hotels.reservationGuests.edit')
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['admin.access'] }))
      .use(middleware.shareAuth())

    router
      .post('/admin/hotels/reservation-guests', [ReservationGuestsController, 'store'])
      .as('admin.hotels.reservationGuests.store')
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['admin.access'] }))
      .use(middleware.shareAuth())

    router
      .post('/admin/hotels/reservation-guests/:id/update', [ReservationGuestsController, 'update'])
      .as('admin.hotels.reservationGuests.update')
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['admin.access'] }))
      .use(middleware.shareAuth())

    router
      .get('/admin/hotels/checkin-checkout-logs', [CheckinCheckoutLogsController, 'index'])
      .as('admin.hotels.checkinCheckoutLogs.index')
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['admin.access'] }))
      .use(middleware.shareAuth())

    router
      .get('/admin/hotels/checkin-checkout-logs/new', [CheckinCheckoutLogsController, 'create'])
      .as('admin.hotels.checkinCheckoutLogs.create')
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['admin.access'] }))
      .use(middleware.shareAuth())

    router
      .get('/admin/hotels/checkin-checkout-logs/:id/edit', [CheckinCheckoutLogsController, 'edit'])
      .as('admin.hotels.checkinCheckoutLogs.edit')
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['admin.access'] }))
      .use(middleware.shareAuth())

    router
      .post('/admin/hotels/checkin-checkout-logs', [CheckinCheckoutLogsController, 'store'])
      .as('admin.hotels.checkinCheckoutLogs.store')
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['admin.access'] }))
      .use(middleware.shareAuth())

    router
      .post('/admin/hotels/checkin-checkout-logs/:id/update', [CheckinCheckoutLogsController, 'update'])
      .as('admin.hotels.checkinCheckoutLogs.update')
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['admin.access'] }))
      .use(middleware.shareAuth())

    router
      .get('/admin/hotels/reservation-charges', [ReservationChargesController, 'index'])
      .as('admin.hotels.reservationCharges.index')
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['admin.access'] }))
      .use(middleware.shareAuth())

    router
      .get('/admin/hotels/reservation-charges/new', [ReservationChargesController, 'create'])
      .as('admin.hotels.reservationCharges.create')
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['admin.access'] }))
      .use(middleware.shareAuth())

    router
      .get('/admin/hotels/reservation-charges/:id/edit', [ReservationChargesController, 'edit'])
      .as('admin.hotels.reservationCharges.edit')
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['admin.access'] }))
      .use(middleware.shareAuth())

    router
      .post('/admin/hotels/reservation-charges', [ReservationChargesController, 'store'])
      .as('admin.hotels.reservationCharges.store')
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['admin.access'] }))
      .use(middleware.shareAuth())

    router
      .post('/admin/hotels/reservation-charges/:id/update', [ReservationChargesController, 'update'])
      .as('admin.hotels.reservationCharges.update')
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['admin.access'] }))
      .use(middleware.shareAuth())

    router
      .get('/admin/hotels/payment-methods', [PaymentMethodsController, 'index'])
      .as('admin.hotels.paymentMethods.index')
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['admin.access'] }))
      .use(middleware.shareAuth())

    router
      .get('/admin/hotels/payment-methods/new', [PaymentMethodsController, 'create'])
      .as('admin.hotels.paymentMethods.create')
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['admin.access'] }))
      .use(middleware.shareAuth())

    router
      .get('/admin/hotels/payment-methods/:id/edit', [PaymentMethodsController, 'edit'])
      .as('admin.hotels.paymentMethods.edit')
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['admin.access'] }))
      .use(middleware.shareAuth())

    router
      .post('/admin/hotels/payment-methods', [PaymentMethodsController, 'store'])
      .as('admin.hotels.paymentMethods.store')
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['admin.access'] }))
      .use(middleware.shareAuth())

    router
      .post('/admin/hotels/payment-methods/:id/update', [PaymentMethodsController, 'update'])
      .as('admin.hotels.paymentMethods.update')
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['admin.access'] }))
      .use(middleware.shareAuth())

    router
      .get('/admin/hotels/cashier-shifts', [CashierShiftsController, 'index'])
      .as('admin.hotels.cashierShifts.index')
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['admin.access'] }))
      .use(middleware.shareAuth())

    router
      .get('/admin/hotels/cashier-shifts/new', [CashierShiftsController, 'create'])
      .as('admin.hotels.cashierShifts.create')
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['admin.access'] }))
      .use(middleware.shareAuth())

    router
      .get('/admin/hotels/cashier-shifts/:id/edit', [CashierShiftsController, 'edit'])
      .as('admin.hotels.cashierShifts.edit')
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['admin.access'] }))
      .use(middleware.shareAuth())

    router
      .post('/admin/hotels/cashier-shifts', [CashierShiftsController, 'store'])
      .as('admin.hotels.cashierShifts.store')
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['admin.access'] }))
      .use(middleware.shareAuth())

    router
      .post('/admin/hotels/cashier-shifts/:id/update', [CashierShiftsController, 'update'])
      .as('admin.hotels.cashierShifts.update')
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['admin.access'] }))
      .use(middleware.shareAuth())

    router
      .get('/admin/hotels/payments', [PaymentsController, 'index'])
      .as('admin.hotels.payments.index')
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['admin.access'] }))
      .use(middleware.shareAuth())

    router
      .get('/admin/hotels/payments/new', [PaymentsController, 'create'])
      .as('admin.hotels.payments.create')
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['admin.access'] }))
      .use(middleware.shareAuth())

    router
      .get('/admin/hotels/payments/:id/edit', [PaymentsController, 'edit'])
      .as('admin.hotels.payments.edit')
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['admin.access'] }))
      .use(middleware.shareAuth())

    router
      .post('/admin/hotels/payments', [PaymentsController, 'store'])
      .as('admin.hotels.payments.store')
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['admin.access'] }))
      .use(middleware.shareAuth())

    router
      .post('/admin/hotels/payments/:id/update', [PaymentsController, 'update'])
      .as('admin.hotels.payments.update')
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['admin.access'] }))
      .use(middleware.shareAuth())

    router
      .get('/admin/hotels/fiscal-documents', [FiscalDocumentsController, 'index'])
      .as('admin.hotels.fiscalDocuments.index')
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['admin.access'] }))
      .use(middleware.shareAuth())

    router
      .get('/admin/hotels/fiscal-documents/new', [FiscalDocumentsController, 'create'])
      .as('admin.hotels.fiscalDocuments.create')
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['admin.access'] }))
      .use(middleware.shareAuth())

    router
      .get('/admin/hotels/fiscal-documents/:id/edit', [FiscalDocumentsController, 'edit'])
      .as('admin.hotels.fiscalDocuments.edit')
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['admin.access'] }))
      .use(middleware.shareAuth())

    router
      .post('/admin/hotels/fiscal-documents', [FiscalDocumentsController, 'store'])
      .as('admin.hotels.fiscalDocuments.store')
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['admin.access'] }))
      .use(middleware.shareAuth())

    router
      .post('/admin/hotels/fiscal-documents/:id/update', [FiscalDocumentsController, 'update'])
      .as('admin.hotels.fiscalDocuments.update')
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['admin.access'] }))
      .use(middleware.shareAuth())

    router
      .get('/admin/hotels/payment-proofs', [PaymentProofsController, 'index'])
      .as('admin.hotels.paymentProofs.index')
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['admin.access'] }))
      .use(middleware.shareAuth())

    router
      .get('/admin/hotels/payment-proofs/new', [PaymentProofsController, 'create'])
      .as('admin.hotels.paymentProofs.create')
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['admin.access'] }))
      .use(middleware.shareAuth())

    router
      .get('/admin/hotels/payment-proofs/:id/edit', [PaymentProofsController, 'edit'])
      .as('admin.hotels.paymentProofs.edit')
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['admin.access'] }))
      .use(middleware.shareAuth())

    router
      .post('/admin/hotels/payment-proofs', [PaymentProofsController, 'store'])
      .as('admin.hotels.paymentProofs.store')
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['admin.access'] }))
      .use(middleware.shareAuth())

    router
      .post('/admin/hotels/payment-proofs/:id/update', [PaymentProofsController, 'update'])
      .as('admin.hotels.paymentProofs.update')
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['admin.access'] }))
      .use(middleware.shareAuth())

    router
      .get('/admin/hotels/payment-transactions', [PaymentTransactionsController, 'index'])
      .as('admin.hotels.paymentTransactions.index')
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['admin.access'] }))
      .use(middleware.shareAuth())

    router
      .get('/admin/hotels/payment-transactions/new', [PaymentTransactionsController, 'create'])
      .as('admin.hotels.paymentTransactions.create')
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['admin.access'] }))
      .use(middleware.shareAuth())

    router
      .get('/admin/hotels/payment-transactions/:id/edit', [PaymentTransactionsController, 'edit'])
      .as('admin.hotels.paymentTransactions.edit')
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['admin.access'] }))
      .use(middleware.shareAuth())

    router
      .post('/admin/hotels/payment-transactions', [PaymentTransactionsController, 'store'])
      .as('admin.hotels.paymentTransactions.store')
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['admin.access'] }))
      .use(middleware.shareAuth())

    router
      .post('/admin/hotels/payment-transactions/:id/update', [PaymentTransactionsController, 'update'])
      .as('admin.hotels.paymentTransactions.update')
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['admin.access'] }))
      .use(middleware.shareAuth())

    router
      .get('/admin/hotels/payment-reservation-allocations', [PaymentReservationAllocationsController, 'index'])
      .as('admin.hotels.paymentReservationAllocations.index')
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['admin.access'] }))
      .use(middleware.shareAuth())

    router
      .get('/admin/hotels/payment-reservation-allocations/new', [PaymentReservationAllocationsController, 'create'])
      .as('admin.hotels.paymentReservationAllocations.create')
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['admin.access'] }))
      .use(middleware.shareAuth())

    router
      .get('/admin/hotels/payment-reservation-allocations/:id/edit', [PaymentReservationAllocationsController, 'edit'])
      .as('admin.hotels.paymentReservationAllocations.edit')
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['admin.access'] }))
      .use(middleware.shareAuth())

    router
      .post('/admin/hotels/payment-reservation-allocations', [PaymentReservationAllocationsController, 'store'])
      .as('admin.hotels.paymentReservationAllocations.store')
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['admin.access'] }))
      .use(middleware.shareAuth())

    router
      .post(
        '/admin/hotels/payment-reservation-allocations/:id/update',
        [PaymentReservationAllocationsController, 'update']
      )
      .as('admin.hotels.paymentReservationAllocations.update')
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['admin.access'] }))
      .use(middleware.shareAuth())

    router
      .get('/admin/hotels/payment-charge-allocations', [PaymentChargeAllocationsController, 'index'])
      .as('admin.hotels.paymentChargeAllocations.index')
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['admin.access'] }))
      .use(middleware.shareAuth())

    router
      .get('/admin/hotels/payment-charge-allocations/new', [PaymentChargeAllocationsController, 'create'])
      .as('admin.hotels.paymentChargeAllocations.create')
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['admin.access'] }))
      .use(middleware.shareAuth())

    router
      .get('/admin/hotels/payment-charge-allocations/:id/edit', [PaymentChargeAllocationsController, 'edit'])
      .as('admin.hotels.paymentChargeAllocations.edit')
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['admin.access'] }))
      .use(middleware.shareAuth())

    router
      .post('/admin/hotels/payment-charge-allocations', [PaymentChargeAllocationsController, 'store'])
      .as('admin.hotels.paymentChargeAllocations.store')
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['admin.access'] }))
      .use(middleware.shareAuth())

    router
      .post('/admin/hotels/payment-charge-allocations/:id/update', [PaymentChargeAllocationsController, 'update'])
      .as('admin.hotels.paymentChargeAllocations.update')
      .use(middleware.auth())
      .use(middleware.permission({ permissions: ['admin.access'] }))
      .use(middleware.shareAuth())

    router.get('/login', [AuthController, 'showLogin']).as('auth.login').use(middleware.guest())

    router.post('/login', [AuthController, 'login']).as('auth.login.submit').use(middleware.guest())

    router.post('/logout', [AuthController, 'logout']).as('auth.logout').use(middleware.auth())
  })