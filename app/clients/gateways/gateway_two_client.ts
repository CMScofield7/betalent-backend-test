import GatewayTwoChargePayload from '#types/gateway_two_charge_payload.type'
import GatewayTwoChargeResponse from '#types/gateway_two_charge_response.type'
import GatewayTwoRefundPayload from '#types/gateway_two_refund_payload.type'
import GatewayTwoRefundResponse from '#types/gateway_two_refund_response.type'
import PaymentGatewayClient from '#interfaces/payment_gateway_client.interface'
import type { ChargeResult } from '#types/charge_result.type'

export default class GatewayTwoClient implements PaymentGatewayClient {
  private readonly baseUrl = process.env.GATEWAY_TWO_URL ?? 'http://localhost:3002'
  private readonly token = process.env.GATEWAY_TWO_TOKEN ?? 'tk_f2198cc671b5289fa856'
  private readonly secret = process.env.GATEWAY_TWO_SECRET ?? '3d15e8ed6131446ea7e3456728b1211f'
  readonly name = 'Gateway 2'

  private withAuth(headers: Record<string, string> = {}) {
    return {
      ...headers,
      'Gateway-Auth-Token': this.token,
      'Gateway-Auth-Secret': this.secret,
      'Content-Type': 'application/json',
    }
  }

  async charge(input: {
    amount: number
    name: string
    email: string
    cardNumber: string
    cvv: string
  }): Promise<ChargeResult> {
    const payload: GatewayTwoChargePayload = {
      valor: input.amount,
      nome: input.name,
      email: input.email,
      numeroCartao: input.cardNumber,
      cvv: input.cvv,
    }

    const response = await fetch(`${this.baseUrl}/transacoes`, {
      method: 'POST',
      headers: this.withAuth(),
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      return { ok: false, status: 'error' }
    }

    const data = (await response.json()) as GatewayTwoChargeResponse

    if (data.status !== 'approved') {
      return { ok: false, status: 'error', externalId: data.id }
    }

    return {
      ok: true,
      status: 'approved',
      externalId: data.id,
    }
  }

  async refund(transactionId: string) {
    const payload: GatewayTwoRefundPayload = {
      id: transactionId,
    }

    const response = await fetch(`${this.baseUrl}/transacoes/reembolso`, {
      method: 'POST',
      headers: this.withAuth(),
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      throw new Error('GatewayTwoClient: refund failed')
    }

    const data = (await response.json()) as GatewayTwoRefundResponse
    return data
  }
}
