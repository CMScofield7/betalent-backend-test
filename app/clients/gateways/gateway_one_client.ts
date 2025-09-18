import PaymentGatewayClient from '#interfaces/payment_gateway_client.interface'
import type { ChargeResult } from '#types/charge_result.type'
import GatewayTokenManager from '#services/gateways/gateway_token_manager'

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

  async charge(input: {
    amount: number
    name: string
    email: string
    cardNumber: string
    cvv: string
  }): Promise<ChargeResult> {
    const token = await this.tokenManager.getToken()

    const response = await fetch(`${this.baseUrl}/transactions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: input.amount,
        name: input.name,
        email: input.email,
        cardNumber: input.cardNumber,
        cvv: input.cvv,
      }),
    })

    const data = await response.text()

    if (!response.ok) {
      console.error('GatewayOneClient charge error:', data)
      return { ok: false, status: 'error' }
    }

    let payload: { id?: string }
    try {
      payload = JSON.parse(data) as { id?: string }
    } catch (error) {
      return { ok: false, status: 'error' }
    }

    if (!payload.id) {
      return { ok: false, status: 'error' }
    }

    return {
      ok: true,
      status: 'approved',
      externalId: payload.id,
    }
  }

  async refund(transactionId: string) {
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
