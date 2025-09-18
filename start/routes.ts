import router from '@adonisjs/core/services/router'

router.get('/', async () => ({
  status: 'ok',
}))

router.post('/checkout', '#controllers/checkout_controller.store')
router.get('/products', '#controllers/products_controller.index')
router.post('/products', '#controllers/products_controller.store')
router.get('/gateways', '#controllers/gateway_controllers.index')
router.patch('/gateways/:id/priority', '#controllers/gateway_controllers.priority')
router.patch('/gateways/:id/toggle', '#controllers/gateway_controllers.toggleActive')
