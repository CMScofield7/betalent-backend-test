import app from '@adonisjs/core/services/app'
import GatewayService from '#services/gateways/gateway_service'
import TransactionService from '#services/transaction_service'
import GatewayOneClient from '#clients/gateways/gateway_one_client'
import GatewayTwoClient from '#clients/gateways/gateway_two_client'
import type { ClientMap } from '#types/client_map.type'

const clients: ClientMap = {
  'Gateway 1': new GatewayOneClient(),
  'Gateway 2': new GatewayTwoClient(),
}

app.container.singleton('app/gateway_service', () => {
  return new GatewayService(clients)
})

app.container.singleton('app/charge_gateway_driver', async (resolver) => {
  return resolver.make('app/gateway_service')
})

app.container.singleton('app/transaction_service', async (resolver) => {
  const gatewayService = (await resolver.make('app/gateway_service')) as GatewayService
  return new TransactionService(gatewayService)
})
