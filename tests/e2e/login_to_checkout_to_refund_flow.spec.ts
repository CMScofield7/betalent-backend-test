import { test } from '@japa/runner'
import Database from '@adonisjs/lucid/services/db'
import hash from '@adonisjs/core/services/hash'
import app from '@adonisjs/core/services/app'

import Gateway from '#models/gateway'
import Transaction from '#models/transaction'
import User, { UserRole } from '#models/user'

import GatewayService from '#services/gateways/gateway_service'
import TransactionService from '#services/transaction_service'
import type { ChargeInput } from '#types/charge_input.type'
import type { ChargeOutput } from '#types/charge_output.types'
import type { ClientMap } from '#types/client_map.type'

class GatewayServiceStub extends GatewayService {
  public readonly gatewayName = 'Gateway Stub'
  public refunded: number | null = null

  constructor() {
    super({} as ClientMap)
  }

  override async listActiveInPriority() {
    return Gateway.query().where('name', this.gatewayName)
  }

  override async charge(_input: ChargeInput): Promise<ChargeOutput> {
    return {
      status: 'approved',
      externalId: 'stub-ext-1',
      gatewayName: this.gatewayName,
    }
  }

  override async refund(transaction: Transaction): Promise<void> {
    this.refunded = transaction.id
  }
}

const gatewayStub = new GatewayServiceStub()

test.group('Checkout flow', (group) => {
  group.setup(() => {
    app.container.bindValue('app/gateway_service', gatewayStub)
    app.container.bindValue('app/charge_gateway_driver', gatewayStub)
    app.container.bindValue('app/transaction_service', new TransactionService(gatewayStub))
  })

  group.each.setup(async () => {
    gatewayStub.refunded = null
    await Database.beginGlobalTransaction()
    return () => Database.rollbackGlobalTransaction()
  })

  test('admin can login, checkout and refund', async ({ assert, client }) => {
    const password = 'admin123'
    const admin = await User.create({
      fullName: 'Admin User',
      email: 'admin@example.com',
      password,
      role: UserRole.ADMIN,
    })

    await Gateway.create({ name: gatewayStub.gatewayName, isActive: true, priority: 1 })

    const loginResponse = await client.post('/login').json({
      email: admin.email,
      password,
    })

    loginResponse.assertStatus(200)
    const token = loginResponse.body().token

    const productResponse = await client
      .post('/products')
      .header('Authorization', `Bearer ${token}`)
      .json({ name: 'Notebook', amount: 3299 })

    productResponse.assertStatus(200)
    const product = productResponse.body()

    const checkoutResponse = await client.post('/checkout').json({
      client: {
        name: 'Zé Cliente',
        email: 'ze.cliente@example.com',
      },
      items: [
        {
          productId: product.id,
          quantity: 1,
        },
      ],
      card: {
        number: '5569000000006063',
        cvv: '123',
      },
    })

    checkoutResponse.assertStatus(200)
    assert.equal(checkoutResponse.body().status, 'approved')
    const transactionId = checkoutResponse.body().transactionId

    const refundResponse = await client
      .post(`/transactions/${transactionId}/refund`)
      .header('Authorization', `Bearer ${token}`)
      .json({})

    refundResponse.assertStatus(200)
    assert.equal(refundResponse.body().status, 'refunded')
    assert.equal(gatewayStub.refunded, transactionId)

    const transaction = await Transaction.findOrFail(transactionId)
    assert.equal(transaction.status, 'refunded')
  })
})
