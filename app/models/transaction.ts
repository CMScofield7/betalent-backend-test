import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, computed, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Client from '#models/client'
import Gateway from '#models/gateway'
import TransactionProduct from '#models/transaction_product'
import type { TransactionStatus } from '#types/transaction_status'

export default class Transaction extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'client_id' })
  declare clientId: number

  @belongsTo(() => Client)
  declare client: BelongsTo<typeof Client>

  @column({ columnName: 'gateway_id' })
  declare gatewayId: number

  @belongsTo(() => Gateway)
  declare gateway: BelongsTo<typeof Gateway>

  @column({ columnName: 'external_id' })
  declare externalId: string | null

  @column()
  declare status: TransactionStatus

  @column()
  declare amount: number

  @computed()
  get amountInReais() {
    return this.amount / 100
  }

  @column({ columnName: 'card_last_numbers' })
  declare cardLastNumbers: string | null

  @hasMany(() => TransactionProduct)
  declare items: HasMany<typeof TransactionProduct>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
