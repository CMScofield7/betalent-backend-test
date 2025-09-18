import type { HttpContext } from '@adonisjs/core/http'
import Product from '#models/product'
import { createProduct } from '#validators/product'

export default class ProductsController {
  async store({ request }: HttpContext) {
    const payload = await request.validateUsing(createProduct)

    return Product.create(payload)
  }

  async index() {
    return Product.query().orderBy('id', 'desc')
  }
}
