import type { ChargeInput } from '#types/charge_input.type'
import type { ChargeResult } from '#types/charge_result.type'

export default interface PaymentGatewayClient {
  name: string
  charge(input: ChargeInput): Promise<ChargeResult>
}
