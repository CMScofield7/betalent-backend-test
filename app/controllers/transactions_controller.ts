import type { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'
import TransactionService from '#services/transaction_service'

export default class TransactionsController {
  private readonly bindingId = 'app/transaction_service' as const

  async refund({ auth, params }: HttpContext) {
    if (!auth.user) {
      throw new Error('User must be authenticated to refund transactions!')
    }

    if (!app.container.hasBinding(this.bindingId)) {
      throw new Error('Transaction service is not bound to the container!')
    }

    const service = (await app.container.make(this.bindingId)) as TransactionService

    return service.refundTransaction(auth.user, Number(params.id))
  }
}
