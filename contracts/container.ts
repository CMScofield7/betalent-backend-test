declare module '@adonisjs/core/types' {
  interface ContainerBindings {
    'app/gateway_service': import('#services/gateways/gateway_service').default
    'app/charge_gateway_driver': import('#services/gateways/gateway_service').default
    'app/transaction_service': import('#services/transaction_service').default
  }
}
