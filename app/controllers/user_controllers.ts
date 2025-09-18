import UserService from '#services/user_service'
import { HttpContext } from '@adonisjs/core/http'

export default class UsersController {
  constructor(private userService: UserService) {}

  async store({ auth, request }: HttpContext) {
    const currentUser = auth.user!
    const payload = request.only(['fullName', 'email', 'password', 'role'])

    return this.userService.createUser(currentUser, payload)
  }

  async index({ auth }: HttpContext) {
    const currentUser = auth.user!
    const users = await this.userService.findAllUsers(currentUser)
    return users
  }

  async indexOne({ auth, params }: HttpContext) {
    const currentUser = auth.user!
    return this.userService.findUserByEmail(currentUser, params.email)
  }

  async update({ auth, params, request }: HttpContext) {
    const currentUser = auth.user!
    const payload = request.only(['fullName', 'password', 'role'])
    return this.userService.updateUser(currentUser, +params.id, payload)
  }

  async destroy({ auth, params }: HttpContext) {
    const currentUser = auth.user!
    return this.userService.deleteUser(currentUser, +params.id)
  }
}
