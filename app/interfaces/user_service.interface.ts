import type User from '#models/user'
import type { UserRole } from '#models/user'

export type CreateUserInput = {
  fullName?: string | null
  email: string
  password: string
  role: UserRole
}

export type UpdateUserInput = {
  fullName?: string | null
  password?: string
  role?: UserRole
}

export default interface UserServiceInterface {
  createUser(currentUser: User, payload: CreateUserInput): Promise<User>
  findAllUsers(currentUser: User): Promise<User[]>
  findUserById(currentUser: User, userId: number): Promise<User | null>
  updateUser(currentUser: User, userId: number, payload: UpdateUserInput): Promise<User>
  deleteUser(currentUser: User, userId: number): Promise<void>
}
