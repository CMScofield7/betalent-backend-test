import type { HttpContext } from '@adonisjs/core/http'
import { login } from '#validators/auth'
import User from '#models/user'
import hash from '@adonisjs/core/services/hash'

export default class AuthController {
  async login({ request, auth, response }: HttpContext) {
    const { email, password } = await request.validateUsing(login)
    const user = await User.findBy('email', email)

    const isValid = user ? await hash.verify(user.password, password) : false

    if (!user || !isValid) {
      return response.unauthorized({
        errors: [
          {
            message: 'Invalid user credentials',
          },
        ],
      })
    }

    const accessToken = await auth.use('api').createToken(user, undefined, {
      expiresIn: '7 days',
      name: 'api-token',
    })

    const serialized = accessToken.toJSON()

    return {
      token: serialized.token,
      type: serialized.type,
      expiresAt: serialized.expiresAt ? serialized.expiresAt.toISOString() : null,
      user,
    }
  }
}
