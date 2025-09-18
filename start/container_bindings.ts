import app from '@adonisjs/core/services/app'
import GatewayService from '#services/gateway_service'
import GatewayOneClient from '#clients/gateways/gateway_one_client'
import GatewayTwoClient from '#clients/gateways/gateway_two_client'
import type { ClientMap } from '#types/client_map.type'

const clients: ClientMap = {
  'Gateway 1': new GatewayOneClient(),
  'Gateway 2': new GatewayTwoClient(),
}

app.container.singleton('app/charge_gateway_driver', () => {
  return new GatewayService(clients)
})
