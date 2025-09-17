export type ChargeOutput = {
  status: 'approved' | 'error'
  externalId?: string
  gatewayName: string
}
