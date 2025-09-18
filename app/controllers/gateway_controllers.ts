import type { HttpContext } from '@adonisjs/core/http'
import Gateway from '#models/gateway'
import { setPriority, toggleActive } from '#validators/gateway'

export default class GatewayControllers {
  async index() {
    return Gateway.query().orderBy('priority', 'asc')
  }

  async priority({ params, request }: HttpContext) {
    const { priority } = await request.validateUsing(setPriority)
    const gateway = await Gateway.findOrFail(+params.id)

    gateway.priority = priority
    await gateway.save()

    return gateway
  }

  async toggleActive({ params, request }: HttpContext) {
    const { isActive } = await request.validateUsing(toggleActive)
    const gateway = await Gateway.findOrFail(+params.id)

    gateway.isActive = isActive
    await gateway.save()

    return gateway
  }
}
