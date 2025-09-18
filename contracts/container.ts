declare module '@adonisjs/core/types' {
  interface ContainerBindings {
    'app/charge_gateway_driver': import('#services/gateway_service').default
  }
}
