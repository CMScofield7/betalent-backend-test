import Gateway from '#models/gateway'
import { ChargeInput } from '#types/charge_input.type'
import { ClientMap } from '#types/client_map.type'
import type { ChargeOutput } from '#types/charge_output.types'
import ChargeGatewayDriver from '#interfaces/charge_gateway_driver.interface'

export default class GatewayService implements ChargeGatewayDriver {
  constructor(private clients: ClientMap) {}

  async listActiveInPriority(): Promise<Gateway[]> {
    return Gateway.query().where('is_active', true).orderBy('priority', 'asc').orderBy('id', 'asc')
  }

  async chargeWithFailover(input: ChargeInput) {
    const gateways = await this.listActiveInPriority()
    let lastError: unknown
    let lastGatewayName = ''

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

  async charge(input: {
    amount: number
    name: string
    email: string
    cardNumber: string
    cvv: string
  }): Promise<ChargeOutput> {
    const { result, gatewayName } = await this.chargeWithFailover(input)

    if (result.ok && result.status === 'approved') {
      return {
        status: 'approved',
        externalId: result.externalId,
        gatewayName,
      }
    }

    return {
      status: 'error',
      externalId: result.externalId,
      gatewayName,
    }
  }
}
