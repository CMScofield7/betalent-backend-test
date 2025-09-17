import { test } from '@japa/runner'
import Database from '@adonisjs/lucid/services/db'
import Gateway from '#models/gateway'
import GatewayService from '#services/gateway_service'
import type { ChargeResult } from '#types/charge_result.type'
import PaymentGatewayClient from '#interfaces/payment_gateway_client.interface'

class ApprovesClient implements PaymentGatewayClient {
  name = 'GATEWAY_OK' as const

  async auth() {}

  async charge(): Promise<ChargeResult> {
    return { ok: true, status: 'approved', externalId: 'ok-1' }
  }
}

class DeclinesClient implements PaymentGatewayClient {
  name = 'GATEWAY_NO' as const

  async auth() {}

  async charge(): Promise<ChargeResult> {
    return { ok: true, status: 'declined' }
  }
}

class ErrorsClient implements PaymentGatewayClient {
  name = 'GATEWAY_ERROR' as const

  async auth() {}

  async charge(): Promise<ChargeResult> {
    throw new Error('error')
  }
}

test.group('GatewayService', (group) => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction()
    return () => Database.rollbackGlobalTransaction()
  })

  test('Only lists active gateways per asc priority', async ({ assert }) => {
    await Gateway.createMany([
      { name: 'A', isActive: true, priority: 2 },
      { name: 'B', isActive: true, priority: 1 },
    ])

    const gatewayService = new GatewayService({})
    const list = await gatewayService.listActiveInPriority()

    assert.equal(list.length, 2)
    assert.deepEqual(
      list.map((gateway: Gateway) => gateway.name),
      ['B', 'A']
    )
  })

  test('Failover: try in order and stops at first success', async ({ assert }) => {
    await Gateway.createMany([
      { name: 'GATEWAY_NO', isActive: true, priority: 1 },
      { name: 'GATEWAY_OK', isActive: true, priority: 2 },
    ])

    const gatewayService = new GatewayService({
      GATEWAY_NO: new DeclinesClient(),
      GATEWAY_OK: new ApprovesClient(),
    })

    const { result, gatewayName } = await gatewayService.chargeWithFailover({
      amount: 1000,
      name: 'name',
      email: 'x@y.com',
      cardNumber: '1111111111111111111',
      cvv: '099',
    })

    assert.equal(result.status, 'approved')
    assert.equal(gatewayName, 'GATEWAY_OK')
  })

  test('When all fail, return error', async ({ assert }) => {
    await Gateway.createMany([
      { name: 'GATEWAY_NO', isActive: true, priority: 1 },
      { name: 'GATEWAY_ERROR', isActive: true, priority: 2 },
    ])

    const gatewayService = new GatewayService({
      GATEWAY_NO: new DeclinesClient(),
      GATEWAY_ERROR: new ErrorsClient(),
    })

    const { result, gatewayName } = await gatewayService.chargeWithFailover({
      amount: 1000,
      name: 'name',
      email: 'x@y.com',
      cardNumber: '1111111111111111111',
      cvv: '100',
    })

    assert.equal(result.status, 'error')
    assert.equal(gatewayName, 'GATEWAY_ERROR')
  })

  test('Ignores gateway with unmapped client', async ({ assert }) => {
    await Gateway.createMany([
      { name: 'A', isActive: true, priority: 1 },
      { name: 'GATEWAY_OK', isActive: true, priority: 2 },
    ])

    const gatewayService = new GatewayService({
      GATEWAY_OK: new ApprovesClient(),
    })

    const { result, gatewayName } = await gatewayService.chargeWithFailover({
      amount: 1000,
      name: 'name',
      email: 'x@y.com',
      cardNumber: '1111111111111111111',
      cvv: '099',
    })

    assert.equal(result.status, 'approved')
    assert.equal(gatewayName, 'GATEWAY_OK')
  })

  test('No active gateways', async ({ assert }) => {
    const gatewayService = new GatewayService({})
    const { result, gatewayName } = await gatewayService.chargeWithFailover({
      amount: 1000,
      name: 'name',
      email: 'x@y.com',
      cardNumber: '1111111111111111111',
      cvv: '099',
    })

    assert.equal(result.status, 'error')
    assert.equal(gatewayName, '')
  })
})
