import { test } from '@japa/runner'
import Database from '@adonisjs/lucid/services/db'

import Client from '#models/client'
import Gateway from '#models/gateway'
import Product from '#models/product'
import Transaction from '#models/transaction'
import TransactionProduct from '#models/transaction_product'
import ClientService from '#services/client_service'

const service = new ClientService()

test.group('ClientService', (group) => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction()
    return () => Database.rollbackGlobalTransaction()
  })

  test('listClients returns all clients ordered by id', async ({ assert }) => {
    await TransactionProduct.query().delete()
    await Transaction.query().delete()
    await Client.query().delete()

    await Client.create({ name: 'B', email: 'b@example.com' })
    await Client.create({ name: 'A', email: 'a@example.com' })

    const clients = await service.listClients()

    assert.lengthOf(clients, 2)
    assert.equal(clients[0].email, 'b@example.com')
    assert.equal(clients[1].email, 'a@example.com')
  })

  test('getClientWithTransactions returns client with transactions and items', async ({
    assert,
  }) => {
    const client = await Client.create({ name: 'Client', email: 'client@example.com' })
    const gateway = await Gateway.create({ name: 'Gateway', isActive: true, priority: 1 })
    const product = await Product.create({ name: 'Product', amount: 1000 })

    const transaction = await Transaction.create({
      clientId: client.id,
      gatewayId: gateway.id,
      status: 'approved',
      amount: 2000,
      cardLastNumbers: '1234',
      externalId: 'ext-1',
    })

    await TransactionProduct.create({
      transactionId: transaction.id,
      productId: product.id,
      quantity: 2,
    })

    const result = await service.getClientWithTransactions(client.id)

    assert.equal(result.id, client.id)
    assert.lengthOf(result.transactions, 1)
    const [loadedTransaction] = result.transactions
    assert.equal(loadedTransaction.id, transaction.id)
    assert.lengthOf(loadedTransaction.items, 1)
    assert.equal(loadedTransaction.items[0].productId, product.id)
  })
})
