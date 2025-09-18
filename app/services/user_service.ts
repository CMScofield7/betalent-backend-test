import User, { UserRole } from '#models/user'
import UserServiceInterface, {
  CreateUserInput,
  UpdateUserInput,
} from '#interfaces/user_service.interface'

export default class UserService implements UserServiceInterface {
  async createUser(currentUser: User, payload: CreateUserInput): Promise<User> {
    this.whoCanManageUsers(currentUser)

    const existing = await User.findBy('email', payload.email)
    if (existing) {
      throw new Error('User already exists!')
    }

    const user = await User.create({
      fullName: payload.fullName ?? null,
      email: payload.email,
      password: payload.password,
      role: payload.role,
    })

    return user
  }

  async findAllUsers(currentUser: User): Promise<User[]> {
    this.whoCanManageUsers(currentUser)
    return User.all()
  }

  async findUserByEmail(currentUser: User, email: string): Promise<User | null> {
    this.whoCanManageUsers(currentUser)
    return User.findBy('email', email)
  }

  async updateUser(currentUser: User, userId: number, payload: UpdateUserInput): Promise<User> {
    const user = await User.findOrFail(userId)
    this.managerCannotManagePeers(currentUser, user)
    this.whoCanManageUsers(currentUser)

    if (payload.fullName !== undefined) {
      user.fullName = payload.fullName
    }

    if (payload.password) {
      user.password = payload.password
    }

    if (payload.role) {
      user.role = payload.role
    }

    await user.save()
    return user
  }

  async deleteUser(currentUser: User, userId: number): Promise<void> {
    const user = await User.findOrFail(userId)
    this.managerCannotManagePeers(currentUser, user)
    this.whoCanDeleteUsers(currentUser)
    await user.delete()
  }

  private whoCanManageUsers(currentUser: User) {
    if (![UserRole.ADMIN, UserRole.MANAGER].includes(currentUser.role)) {
      throw new Error('You are not allowed to manage users!')
    }
  }

  private whoCanDeleteUsers(currentUser: User) {
    if (![UserRole.ADMIN, UserRole.MANAGER].includes(currentUser.role)) {
      throw new Error('Only admins can delete users!')
    }
  }

  private managerCannotManagePeers(currentUser: User, targetUser: User) {
    if (
      currentUser.role === UserRole.MANAGER &&
      [UserRole.ADMIN, UserRole.MANAGER].includes(targetUser.role)
    ) {
      throw new Error('Managers cannot manage admins or other managers!')
    }
  }
}
