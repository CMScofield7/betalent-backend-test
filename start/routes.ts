import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'
import { UserRole } from '#models/user'

router.get('/', async () => ({
  status: 'ok',
}))

router.post('/login', '#controllers/auth_controller.login')
router.post('/checkout', '#controllers/checkout_controller.store')

router
  .group(() => {
    router.get('/gateways', '#controllers/gateway_controllers.index')
    router.patch('/gateways/:id/priority', '#controllers/gateway_controllers.priority')
    router.patch('/gateways/:id/active', '#controllers/gateway_controllers.toggleActive')
  })
  .use([middleware.auth(), middleware.role([UserRole.ADMIN])])

router.get('/users/me', '#controllers/user_controllers.me').use([middleware.auth()])

router
  .group(() => {
    router.post('/products', '#controllers/products_controller.store')
    router.get('/products', '#controllers/products_controller.index')
  })
  .use([middleware.auth(), middleware.role([UserRole.ADMIN, UserRole.FINANCE])])

router
  .group(() => {
    router.get('/users', '#controllers/user_controllers.index')
    router.get('/users/:email', '#controllers/user_controllers.indexOne')
    router.post('/users', '#controllers/user_controllers.store')
    router.patch('/users/:id', '#controllers/user_controllers.update')
    router.delete('/users/:id', '#controllers/user_controllers.destroy')
  })
  .use([middleware.auth(), middleware.role([UserRole.ADMIN, UserRole.MANAGER])])
