import Gateway from '#models/gateway'
import Transaction from '#models/transaction'
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
        if (!response.ok || response.status !== 'approved') {
          console.warn(`${gateway.name} returned non-approval`, response)
        }
      } catch (error) {
        console.error(`Gateway ${gateway.name} call failed`, error)
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

  async charge(input: ChargeInput): Promise<ChargeOutput> {
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

  async refund(transaction: Transaction): Promise<void> {
    if (!transaction.externalId) {
      throw new Error('Transaction does not have an external id for refund!')
    }

    const gateway = await Gateway.findOrFail(transaction.gatewayId)
    const client = this.clients[gateway.name]

    if (!client || typeof client.refund !== 'function') {
      throw new Error(`Gateway ${gateway.name} does not support refunds!`)
    }

    await client.refund(transaction.externalId)
  }
}
