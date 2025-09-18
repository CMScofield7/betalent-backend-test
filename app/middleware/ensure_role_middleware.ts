import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

import { UserRole } from '#models/user'

export default class EnsureRoleMiddleware {
  async handle(context: HttpContext, next: NextFn, roles: UserRole[]) {
    const user = context.auth.user

    if (!user) {
      return context.response.unauthorized({
        message: 'Authentication required.',
      })
    }

    if (!roles.includes(user.role)) {
      return context.response.forbidden({
        message: 'You do not have permission to perform this action.',
      })
    }

    return next()
  }
}
