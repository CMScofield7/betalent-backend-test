import Transaction from '#models/transaction'
import User, { UserRole } from '#models/user'
import type GatewayService from '#services/gateways/gateway_service'

type RefundGateway = Pick<GatewayService, 'refund'>

export default class TransactionService {
  constructor(private gatewayService: RefundGateway) {}

  async refundTransaction(currentUser: User, transactionId: number): Promise<Transaction> {
    this.whoCanRefund(currentUser)

    const transaction = await Transaction.findOrFail(transactionId)

    if (!transaction.externalId) {
      throw new Error('Transaction does not have an external id for refund!')
    }

    if (transaction.status !== 'approved') {
      throw new Error('Only approved transactions can be refunded!')
    }

    await this.gatewayService.refund(transaction)

    transaction.status = 'refunded'
    await transaction.save()

    return transaction
  }

  private whoCanRefund(currentUser: User) {
    if (![UserRole.ADMIN, UserRole.FINANCE].includes(currentUser.role)) {
      throw new Error('You are not allowed to refund transactions!')
    }
  }
}
