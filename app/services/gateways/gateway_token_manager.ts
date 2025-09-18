import { decodeJwt } from 'jose'
import GatewayOneLoginResponse from '#interfaces/gateway_one_login_response.interface'

export default class GatewayTokenManager {
  private token: string | null = null
  private tokenExpiresAt: number | null = null

  constructor(
    private readonly baseUrl: string,
    private readonly payload: { email: string; token: string }
  ) {}

  async getToken(): Promise<string> {
    if (this.isTokenValid()) {
      return this.token as string
    }

    const response = await fetch(`${this.baseUrl}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(this.payload),
    })

    if (!response.ok) {
      throw new Error('GatewayTokenManager: login failed')
    }

    const { token } = (await response.json()) as GatewayOneLoginResponse
    this.token = token
    this.tokenExpiresAt = GatewayTokenManager.extractExpiration(token)

    return token
  }

  private isTokenValid() {
    if (!this.token || !this.tokenExpiresAt) {
      return false
    }

    const now = Math.floor(Date.now() / 1000)
    return now < this.tokenExpiresAt - 30
  }

  private static extractExpiration(token: string): number | null {
    try {
      const { exp } = decodeJwt(token)
      return typeof exp === 'number' ? exp : null
    } catch (error) {
      console.error('GatewayTokenManager: unable to decode token expiration', error)
      return null
    }
  }
}
