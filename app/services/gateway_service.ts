import Gateway from '#models/gateway'
import { ChargeInput } from '#types/charge_input.type'
import { ClientMap } from '#types/client_map.type'

export default class GatewayService {
  constructor(private clients: ClientMap) {}

  async listActiveInPriority(): Promise<Gateway[]> {
    return Gateway.query().where('is_active', true).orderBy('priority', 'asc').orderBy('id', 'asc')
  }

  async chargeWithFailover(input: ChargeInput) {
    const gateways = await this.listActiveInPriority()
    let lastError: unknown
    let lastGatewayName: string = ''

    for (const gateway of gateways) {
      const client = this.clients[gateway.name]
      if (!client) continue
      lastGatewayName = gateway.name

      try {
        const response = await client.charge(input)
        if (response.ok && response.status === 'approved') {
          return {
            result: response,
            gatewayName: gateway.name,
          }
        }
      } catch (error) {
        lastError = error
      }
    }

    return {
      result: {
        ok: false,
        status: 'error',
        externalId: undefined,
      },
      gatewayName: lastGatewayName,
      error: lastError,
    }
  }
}
