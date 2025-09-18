import { BaseSeeder } from '@adonisjs/lucid/seeders'
import User, { UserRole } from '#models/user'

export default class UserSeeder extends BaseSeeder {
  public static environment = ['development', 'testing']

  async run() {
    const adminPassword = 'admin123'

    await User.updateOrCreate(
      { email: 'x@y.com' },
      {
        fullName: 'Laion Brito',
        password: adminPassword,
        role: UserRole.ADMIN,
      }
    )
  }
}
