export type ChargeResult = {
  ok: boolean
  status: 'approved' | 'declined' | 'error'
  externalId?: string
}
