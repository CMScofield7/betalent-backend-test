export default interface GatewayOneChargeResponse {
  status: 'approved' | 'declined' | 'error'
  transaction_id?: string
  message?: string
}
