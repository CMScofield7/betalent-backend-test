import Gateway from '#models/gateway'
import Product from '#models/product'
import Client from '#models/client'
import Transaction from '#models/transaction'
import TransactionProduct from '#models/transaction_product'
import { Payload } from '#types/payload.type'
import ChargeGatewayDriver from '#interfaces/charge_gateway_driver.interface'

export default class CheckoutService {
  constructor(private gatewayDriver: ChargeGatewayDriver) {}

  async run(payload: Payload) {
    const client = await Client.firstOrCreate(
      { email: payload.client.email },
      { name: payload.client.name, email: payload.client.email }
    )

    const ids = payload.items.map((item) => item.productId)
    const products = await Product.query().whereIn('id', ids)

    const priceById = new Map(products.map((product) => [product.id, product.amount]))
    const amount = payload.items.reduce((sum, i) => {
      const price = priceById.get(i.productId)
      if (!price) throw new Error(`Product ${i.productId} not found!`)

      return sum + price * i.quantity
    }, 0)

    const charge = await this.gatewayDriver.charge({
      amount,
      name: client.name,
      email: client.email,
      cardNumber: payload.card.number,
      cvv: payload.card.cvv,
    })

    const gateway = await Gateway.findByOrFail('name', charge.gatewayName)

    const transaction = await Transaction.create({
      clientId: client.id,
      gatewayId: gateway.id,
      status: charge.status,
      amount,
      cardLastNumbers: payload.card.number.slice(-4),
      externalId: charge.externalId,
    })

    await TransactionProduct.createMany(
      payload.items.map((item) => ({
        transactionId: transaction.id,
        productId: item.productId,
        quantity: item.quantity,
      }))
    )

    return {
      transactionId: transaction.id,
      status: transaction.status,
      amount,
    }
  }
}
