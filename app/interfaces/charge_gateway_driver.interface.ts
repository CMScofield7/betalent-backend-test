import { ChargeOutput } from '#types/charge_output.types'

export default interface ChargeGatewayDriver {
  charge(input: {
    amount: number
    name: string
    email: string
    cardNumber: string
    cvv: string
  }): Promise<ChargeOutput>
}
