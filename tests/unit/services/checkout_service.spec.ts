import { test } from '@japa/runner'
import Database from '@adonisjs/lucid/services/db'

import Gateway from '#models/gateway'
import Product from '#models/product'
import Client from '#models/client'
import Transaction from '#models/transaction'

import CheckoutService from '#services/checkout_service'

class GatewayOKStub {
  async charge() {
    return {
      status: 'approved' as const,
      externalId: 'ok-123',
      gatewayName: 'GATEWAY_OK',
    }
  }
}

class GatewayDeclinesStub {
  async charge() {
    return {
      status: 'error' as const,
      gatewayName: 'GATEWAY_NO',
    }
  }
}

test.group('CheckoutService', (group) => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction()
    return () => Database.rollbackGlobalTransaction()
  })

  test('Calculates the total (in cents), creates the transaction and checks approved', async ({
    assert,
  }) => {
    const product1 = await Product.create({
      name: 'Camisa',
      amount: 1299,
    })

    const product2 = await Product.create({
      name: 'Calça',
      amount: 1499,
    })

    const gateway1 = await Gateway.create({
      name: 'GATEWAY_OK',
      isActive: true,
      priority: 1,
    })

    const gatewayService = new CheckoutService(new GatewayOKStub())

    const result = await gatewayService.run({
      client: {
        name: 'Zé da Manga',
        email: 'x@y.com',
      },
      items: [
        {
          productId: product1.id,
          quantity: 2,
        },
        {
          productId: product2.id,
          quantity: 1,
        },
      ],
      card: {
        number: '11111111111111',
        cvv: '123',
      },
    })

    const expectedTotal = product1.amount * 2 + product2.amount

    assert.equal(result.amount, expectedTotal)
    assert.equal(result.status, 'approved')
    assert.ok(result.transactionId)

    const transaction = await Transaction.query()
      .where('id', result.transactionId)
      .preload('items')
      .firstOrFail()

    assert.equal(transaction.amount, expectedTotal)
    assert.equal(transaction.cardLastNumbers, '1111')
    assert.equal(transaction.status, 'approved')
    assert.equal(transaction.externalId, 'ok-123')
    assert.equal(transaction.gatewayId, gateway1.id)
    assert.equal(transaction.items.length, 2)

    const tShirtItem = transaction.items.find((item) => item.productId === product1.id)!
    const pantsItem = transaction.items.find((item) => item.productId === product2.id)!

    assert.equal(tShirtItem.quantity, 2)
    assert.equal(pantsItem.quantity, 1)

    const client = await Client.findByOrFail('email', 'x@y.com')

    assert.equal(client.name, 'Zé da Manga')
  })

  test('When the gateway returns and error or declined, the transaction gets an error (no failover)', async ({
    assert,
  }) => {
    const product = await Product.create({
      name: 'Camisa',
      amount: 1299,
    })

    await Gateway.create({
      name: 'GATEWAY_NO',
      isActive: true,
      priority: 1,
    })

    const gatewayService = new CheckoutService(new GatewayDeclinesStub())

    const result = await gatewayService.run({
      client: {
        name: 'Zé da Manga',
        email: 'x@y.com',
      },
      items: [
        {
          productId: product.id,
          quantity: 2,
        },
      ],
      card: {
        number: '11111111111111',
        cvv: '123',
      },
    })

    const expectedAmount = product.amount * 2

    assert.equal(result.status, 'error')
    assert.equal(result.amount, expectedAmount)

    const transaction = await Transaction.findOrFail(result.transactionId)

    assert.equal(transaction.status, 'error')
    assert.equal(transaction.amount, expectedAmount)
  })
})
