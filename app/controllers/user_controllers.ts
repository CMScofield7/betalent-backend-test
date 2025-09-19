import { inject } from '@adonisjs/core/container'
import { HttpContext } from '@adonisjs/core/http'
import UserService from '#services/user_service'

@inject()
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

  async me({ auth }: HttpContext) {
    return auth.user!
  }

  async indexOne({ auth, params }: HttpContext) {
    const currentUser = auth.user!
    return this.userService.findUserById(currentUser, +params.id)
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
