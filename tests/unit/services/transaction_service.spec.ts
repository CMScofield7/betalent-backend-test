import { test } from '@japa/runner'
import Database from '@adonisjs/lucid/services/db'

import TransactionService from '#services/transaction_service'
import Transaction from '#models/transaction'
import Gateway from '#models/gateway'
import Client from '#models/client'
import User, { UserRole } from '#models/user'

class GatewayServiceStub {
  public lastTransaction: Transaction | null = null

  async refund(transaction: Transaction) {
    this.lastTransaction = transaction
  }
}

async function makeUser(role: UserRole) {
  return User.create({
    fullName: 'Test User',
    email: `user-${Math.random()}@example.com`,
    password: 'secret',
    role,
  })
}

async function makeApprovedTransaction() {
  const client = await Client.create({
    name: 'Client',
    email: `client-${Math.random()}@example.com`,
  })
  const gateway = await Gateway.create({
    name: `Gateway-${Math.random()}`,
    isActive: true,
    priority: 1,
  })

  return Transaction.create({
    clientId: client.id,
    gatewayId: gateway.id,
    status: 'approved',
    amount: 1000,
    cardLastNumbers: '1234',
    externalId: 'ext-1',
  })
}

test.group('TransactionService', (group) => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction()
    return () => Database.rollbackGlobalTransaction()
  })

  test('finance user can refund an approved transaction', async ({ assert }) => {
    const gatewayService = new GatewayServiceStub()
    const service = new TransactionService(gatewayService)
    const finance = await makeUser(UserRole.FINANCE)
    const transaction = await makeApprovedTransaction()

    const refunded = await service.refundTransaction(finance, transaction.id)

    assert.equal(refunded.status, 'refunded')
    assert.equal(gatewayService.lastTransaction?.id, transaction.id)
  })

  test('admin can refund an approved transaction', async ({ assert }) => {
    const gatewayService = new GatewayServiceStub()
    const service = new TransactionService(gatewayService)
    const admin = await makeUser(UserRole.ADMIN)
    const transaction = await makeApprovedTransaction()

    const refunded = await service.refundTransaction(admin, transaction.id)

    assert.equal(refunded.status, 'refunded')
  })

  test('non privileged user cannot refund', async ({ assert }) => {
    const gatewayService = new GatewayServiceStub()
    const service = new TransactionService(gatewayService)
    const user = await makeUser(UserRole.USER)
    const transaction = await makeApprovedTransaction()

    await assert.rejects(() => service.refundTransaction(user, transaction.id))
  })

  test('cannot refund transaction without external id', async ({ assert }) => {
    const gatewayService = new GatewayServiceStub()
    const service = new TransactionService(gatewayService)
    const finance = await makeUser(UserRole.FINANCE)
    const transaction = await makeApprovedTransaction()
    transaction.externalId = null
    await transaction.save()

    await assert.rejects(() => service.refundTransaction(finance, transaction.id))
  })

  test('cannot refund when transaction is not approved', async ({ assert }) => {
    const gatewayService = new GatewayServiceStub()
    const service = new TransactionService(gatewayService)
    const finance = await makeUser(UserRole.FINANCE)

    const client = await Client.create({
      name: 'Client',
      email: `client-${Math.random()}@example.com`,
    })
    const gateway = await Gateway.create({
      name: `Gateway-${Math.random()}`,
      isActive: true,
      priority: 1,
    })
    const transaction = await Transaction.create({
      clientId: client.id,
      gatewayId: gateway.id,
      status: 'error',
      amount: 1000,
      cardLastNumbers: '1234',
      externalId: 'ext-2',
    })

    await assert.rejects(() => service.refundTransaction(finance, transaction.id))
  })
})
