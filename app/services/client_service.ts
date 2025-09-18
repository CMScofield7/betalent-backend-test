import Client from '#models/client'

export default class ClientService {
  async listClients() {
    return Client.query().orderBy('id', 'asc')
  }

  async getClientWithTransactions(clientId: number) {
    return Client.query()
      .where('id', clientId)
      .preload('transactions', (transactionQuery) => {
        transactionQuery.orderBy('createdAt', 'desc').preload('items')
      })
      .firstOrFail()
  }
}
