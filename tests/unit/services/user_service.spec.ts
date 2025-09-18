import { test } from '@japa/runner'
import Database from '@adonisjs/lucid/services/db'
import hash from '@adonisjs/core/services/hash'
import User, { UserRole } from '#models/user'
import UserService from '#services/user_service'

const service = new UserService()

async function makeUser(payload: {
  fullName?: string | null
  email?: string
  password?: string
  role?: UserRole
}) {
  return User.create({
    fullName: payload.fullName ?? 'Zé da Manga',
    email: payload.email ?? `user-${Math.random()}@test.com`,
    password: payload.password ?? (await hash.make('secret')),
    role: payload.role ?? UserRole.USER,
  })
}

test.group('UserService', (group) => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction()
    return () => Database.rollbackGlobalTransaction()
  })

  test('admin can create a new user', async ({ assert }) => {
    const admin = await makeUser({ role: UserRole.ADMIN })

    const created = await service.createUser(admin, {
      fullName: 'Manager Jane',
      email: 'manager@example.com',
      password: 'secret123',
      role: UserRole.MANAGER,
    })

    assert.equal(created.email, 'manager@example.com')
    assert.equal(created.role, UserRole.MANAGER)
    assert.notEqual(created.password, 'secret123')
  })

  test('fail when email already exists', async ({ assert }) => {
    const admin = await makeUser({ role: UserRole.ADMIN })
    await makeUser({ email: 'dupe@example.com' })

    await assert.rejects(() =>
      service.createUser(admin, {
        fullName: 'Duplicate',
        email: 'dupe@example.com',
        password: 'secret123',
        role: UserRole.MANAGER,
      })
    )
  })

  test('non privileged user cannot create users', async ({ assert }) => {
    const actor = await makeUser({ role: UserRole.USER })

    await assert.rejects(() =>
      service.createUser(actor, {
        fullName: 'Test',
        email: 'test@example.com',
        password: 'secret',
        role: UserRole.USER,
      })
    )
  })

  test('manager can update user data', async ({ assert }) => {
    const manager = await makeUser({ role: UserRole.MANAGER })
    const user = await makeUser({ fullName: 'Old Name' })

    const updated = await service.updateUser(manager, user.id, {
      fullName: 'New Name',
      password: 'new-secret',
      role: UserRole.FINANCE,
    })

    assert.equal(updated.fullName, 'New Name')
    assert.equal(updated.role, UserRole.FINANCE)
    assert.notEqual(updated.password, 'new-secret')
  })

  test('finance cannot update user', async ({ assert }) => {
    const finance = await makeUser({ role: UserRole.FINANCE })
    const user = await makeUser({})

    await assert.rejects(() =>
      service.updateUser(finance, user.id, {
        fullName: 'Should not update',
      })
    )
  })

  test('admin can delete user', async ({ assert }) => {
    const admin = await makeUser({ role: UserRole.ADMIN })
    const user = await makeUser({})

    await service.deleteUser(admin, user.id)

    const found = await User.find(user.id)
    assert.isNull(found)
  })

  test('manager cannot delete user', async ({ assert }) => {
    const manager = await makeUser({ role: UserRole.MANAGER })
    const user = await makeUser({})

    await assert.rejects(() => service.deleteUser(manager, user.id))
  })

  test('findUserByEmail returns a user when it exists', async ({ assert }) => {
    const admin = await makeUser({ role: UserRole.ADMIN })
    const user = await makeUser({ email: 'lookup@example.com' })

    const found = await service.findUserByEmail(admin, 'lookup@example.com')

    assert.isNotNull(found)
    assert.equal(found!.id, user.id)
  })

  test('findUserByEmail returns null when email does not exist', async ({ assert }) => {
    const admin = await makeUser({ role: UserRole.ADMIN })
    const found = await service.findUserByEmail(admin, 'missing@example.com')

    assert.isNull(found)
  })

  test('manager cannot update another manager and admin', async ({ assert }) => {
    const manager = await makeUser({ role: UserRole.MANAGER })
    const admin = await makeUser({ role: UserRole.ADMIN })

    await assert.rejects(() =>
      service.updateUser(manager, manager.id, {
        fullName: 'Nope',
      })
    )

    await assert.rejects(() =>
      service.updateUser(manager, admin.id, {
        fullName: 'Nope',
      })
    )
  })

  test('manager cannot delete manager and admin', async ({ assert }) => {
    const manager = await makeUser({ role: UserRole.MANAGER })
    const admin = await makeUser({ role: UserRole.ADMIN })

    await assert.rejects(() => service.deleteUser(manager, manager.id))
    await assert.rejects(() => service.deleteUser(manager, admin.id))
  })
})
