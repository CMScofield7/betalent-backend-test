import PaymentGatewayClient from '#interfaces/payment_gateway_client.interface'
import GatewayOneChargePayload from '#interfaces/gateway_one_charge_payload.interface'
import GatewayOneChargeResponse from '#interfaces/gateway_one_charge_response.interface'
import GatewayOneRefundResponse from '#interfaces/gateway_one_refund_response.interface'
import type { ChargeResult } from '#types/charge_result.type'
import GatewayTokenManager from '#services/gateways/gateway_token_manager'
import { ChargeInput } from '#types/charge_input.type'

export default class GatewayOneClient implements PaymentGatewayClient {
  private readonly baseUrl = process.env.GATEWAY_ONE_URL ?? 'http://localhost:3001'
  private readonly email = process.env.GATEWAY_ONE_EMAIL ?? 'dev@betalent.tech'
  private readonly credentialsToken = process.env.GATEWAY_ONE_TOKEN
  private readonly tokenManager: GatewayTokenManager
  readonly name = 'Gateway 1'

  constructor() {
    if (!this.credentialsToken) {
      throw new Error('GatewayOneClient: credential token not configured')
    }

    this.tokenManager = new GatewayTokenManager(this.baseUrl, {
      email: this.email,
      token: this.credentialsToken,
    })
  }

  async charge(input: ChargeInput): Promise<ChargeResult> {
    const token = await this.tokenManager.getToken()

    const payload: GatewayOneChargePayload = {
      amount: input.amount,
      name: input.name,
      email: input.email,
      cardNumber: input.cardNumber,
      cvv: input.cvv,
    }

    const response = await fetch(`${this.baseUrl}/transactions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const data = await response.text()

    if (!response.ok) {
      console.error('GatewayOneClient charge error:', data)
      return { ok: false, status: 'error' }
    }

    let parsed: GatewayOneChargeResponse
    try {
      parsed = JSON.parse(data) as GatewayOneChargeResponse
    } catch (error) {
      return { ok: false, status: 'error' }
    }

    if (!parsed.id) {
      return { ok: false, status: 'error' }
    }

    return {
      ok: true,
      status: 'approved',
      externalId: parsed.id,
    }
  }

  async refund(transactionId: string): Promise<GatewayOneRefundResponse> {
    const token = await this.tokenManager.getToken()

    const response = await fetch(`${this.baseUrl}/transactions/${transactionId}/charge_back`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error('GatewayOneClient: refund failed')
    }

    return { ok: true }
  }
}
