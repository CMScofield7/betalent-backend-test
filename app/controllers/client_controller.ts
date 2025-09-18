import { inject } from '@adonisjs/core/container'
import type { HttpContext } from '@adonisjs/core/http'
import ClientService from '#services/client_service'

@inject()
export default class ClientController {
  constructor(private clientService: ClientService) {}

  async index({}: HttpContext) {
    return this.clientService.listClients()
  }

  async show({ params }: HttpContext) {
    return this.clientService.getClientWithTransactions(Number(params.id))
  }
}
