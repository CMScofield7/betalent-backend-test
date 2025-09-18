export default interface GatewayTwoChargeResponse {
  status: 'approved' | 'declined' | 'error'
  id?: string
  message?: string
}
