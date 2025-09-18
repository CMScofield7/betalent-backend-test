import GatewayOneChargeResponse from '#types/gateway_one_charge_response.type'
import GatewayOneLoginResponse from '#types/gateway_one_login_response.type'
import PaymentGatewayClient from '#interfaces/payment_gateway_client.interface'
import type { ChargeResult } from '#types/charge_result.type'

export default class GatewayOneClient implements PaymentGatewayClient {
  private readonly baseUrl = process.env.GATEWAY_ONE_URL ?? 'http://localhost:3001'
  private accessToken: string | null = null
  readonly name = 'Gateway 1'

  private async getToken(): Promise<string> {
    if (this.accessToken) {
      return this.accessToken
    }

    const response = await fetch(`${this.baseUrl}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'dev@betalent.tech',
        token: 'FEC9BB078BF338F464F96B48089EB498',
      }),
    })

    if (!response.ok) {
      throw new Error('GatewayOneClient: login failed...')
    }

    const payload = (await response.json()) as GatewayOneLoginResponse
    this.accessToken = payload.token
    return this.accessToken
  }

  async charge(input: {
    amount: number
    name: string
    email: string
    cardNumber: string
    cvv: string
  }): Promise<ChargeResult> {
    const token = await this.getToken()

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

    if (!response.ok) {
      return { ok: false, status: 'error' }
    }

    const payload = (await response.json()) as GatewayOneChargeResponse

    if (payload.status !== 'approved') {
      return {
        ok: false,
        status: 'error',
        externalId: payload.transaction_id,
      }
    }

    return {
      ok: true,
      status: 'approved',
      externalId: payload.transaction_id,
    }
  }

  async refund(transactionId: string) {
    const token = await this.getToken()

    const response = await fetch(`${this.baseUrl}/transactions/${transactionId}/charge_back`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error('GatewayOneClient: refund failed...')
    }

    return { ok: true }
  }
}
