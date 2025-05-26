import { FastifyReply, FastifyRequest } from 'fastify'
import { logger } from '@/utils/logger'

// Define a type for permissions if you have a clear mapping
type Permission = string; // e.g., 'user.read', 'course.create'

// A simple role-based permission check function
// In a real app, this would be more sophisticated, perhaps with a DB lookup
const rolePermissions: Record<string, Permission[]> = {
  ADMIN: [
    'user.manage', 'settings.manage', 'course.manage', 'question.manage',
    'exam.manage', 'file.manage', 'learning.view', 'exam.take', 'progress.view'
  ],
  TEACHER: [
    'course.manage', 'question.manage', 'exam.manage', 'user.view_all',
    'file.manage', 'learning.view', 'progress.view'
  ],
  STUDENT: [
    'learning.view', 'exam.take', 'progress.view'
  ],
}

export const authorize = (requiredRoles: string[] = [], requiredPermission?: Permission) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = request.user // This comes from the authenticate preHandler
      
      if (!user) {
        logger.warn('Authorization failed: No user found in request context.')
        return reply.code(403).send({ success: false, error: 'Forbidden', message: '权限不足，请登录' })
      }

      const userRole = user.role.toUpperCase()

      // 1. Check for required roles
      if (requiredRoles.length > 0 && !requiredRoles.includes(userRole)) {
        logger.warn(`Authorization failed for user ${user.userId}: Role '${userRole}' not in required roles [${requiredRoles.join(', ')}]`)
        return reply.code(403).send({ success: false, error: 'Forbidden', message: '您的角色无权访问此资源' })
      }

      // 2. Check for specific permission
      if (requiredPermission) {
        const userPermissions = rolePermissions[userRole] || []
        if (!userPermissions.includes(requiredPermission)) {
          logger.warn(`Authorization failed for user ${user.userId}: Missing permission '${requiredPermission}' for role '${userRole}'`)
          return reply.code(403).send({ success: false, error: 'Forbidden', message: '您的账户无权执行此操作' })
        }
      }
    } catch (error) {
      logger.error('Authorization preHandler error:', error)
      reply.code(500).send({ success: false, error: 'Internal Server Error', message: '授权过程中发生错误' })
    }
  }
}
