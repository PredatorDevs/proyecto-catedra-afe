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

    router.get('/login', [AuthController, 'showLogin']).use(middleware.guest())
    router.get('/register', [AuthController, 'showRegister']).use(middleware.guest())

    router.post('/login', [AuthController, 'login']).use(middleware.guest())
    router.post('/register', [AuthController, 'register']).use(middleware.guest())

    router.post('/logout', [AuthController, 'logout']).use(middleware.auth())
  })