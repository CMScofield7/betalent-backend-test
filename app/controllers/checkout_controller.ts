import type { HttpContext } from '@adonisjs/core/http'
import CheckoutService from '#services/checkout_service'
import { checkout } from '#validators/checkout'
import ChargeGatewayDriver from '#interfaces/charge_gateway_driver.interface'
import app from '@adonisjs/core/services/app'

export default class CheckoutController {
  async store({ request }: HttpContext) {
    const payload = await request.validateUsing(checkout)

    const bindingId = 'app/charge_gateway_driver' as const
    if (!app.container.hasBinding(bindingId)) {
      throw new Error('Charge gateway driver is not bound to the container!')
    }

    const gatewayDriver = (await app.container.make(bindingId)) as ChargeGatewayDriver
    const checkoutService = new CheckoutService(gatewayDriver)

    return checkoutService.run(payload)
  }
}
