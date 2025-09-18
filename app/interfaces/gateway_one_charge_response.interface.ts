export default interface GatewayOneChargeResponse {
  status: 'approved' | 'declined' | 'error'
  id?: string
  message?: string
}
