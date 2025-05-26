import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import bcrypt from 'bcrypt'
import { prisma } from '@/config/database'
import { validateBody } from '@/middlewares/validation'
import { authenticate } from '@/middlewares/auth'
import { cache } from '@/config/redis'
import { logger } from '@/utils/logger'

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1, 'Name is required').max(50, 'Name too long'),
  role: z.enum(['STUDENT', 'TEACHER']).optional().default('STUDENT'),
})

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
})

const updateProfileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name too long').optional(),
  avatar: z.string().url('Invalid avatar URL').optional(),
})

const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
})

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
})

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email format'),
})

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
})

export const authRoutes = async (app: FastifyInstance) => {
  // Register user
  app.post('/register', {
    preHandler: validateBody(registerSchema),
    schema: {
      description: 'Register a new user',
      tags: ['Authentication'],
      body: {
        type: 'object',
        required: ['email', 'password', 'name'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 6 },
          name: { type: 'string', minLength: 1, maxLength: 50 },
          role: { type: 'string', enum: ['STUDENT', 'TEACHER'], default: 'STUDENT' },
        },
      },
      response: {
        201: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            userId: { type: 'string' },
          },
        },
        400: { $ref: 'ErrorResponse' },
        409: { $ref: 'ErrorResponse' },
      },
    },
  }, async (request, reply) => {
    const { email, password, name, role } = request.body as z.infer<typeof registerSchema>

    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return reply.code(409).send({ success: false, error: 'Conflict', message: '邮箱已被注册' })
    }

    const hashedPassword = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role,
      },
    })

    // Invalidate user cache if exists
    await cache.invalidatePattern(`user:${user.id}`)

    reply.code(201).send({ success: true, message: '用户注册成功', userId: user.id })
  })

  // Login user
  app.post('/login', {
    preHandler: validateBody(loginSchema),
    schema: {
      description: 'Login user',
      tags: ['Authentication'],
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            token: { type: 'string' },
            refreshToken: { type: 'string' },
            expiresIn: { type: 'number', description: 'Token expires in seconds' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                name: { type: 'string' },
                role: { type: 'string' },
                avatar: { type: 'string' },
                createdAt: { type: 'string' },
                isActive: { type: 'boolean' },
              },
            },
          },
        },
        400: { $ref: 'ErrorResponse' },
        401: { $ref: 'ErrorResponse' },
      },
    },
  }, async (request, reply) => {
    const { email, password } = request.body as z.infer<typeof loginSchema>

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return reply.code(401).send({ success: false, error: 'Unauthorized', message: '邮箱或密码错误' })
    }

    if (!user.isActive) {
      return reply.code(401).send({ success: false, error: 'Unauthorized', message: '账户已被禁用，请联系管理员' })
    }

    // Generate JWT token
    const token = app.jwt.sign({ userId: user.id, role: user.role })
    const refreshToken = app.jwt.sign({ userId: user.id, type: 'refresh' }, { expiresIn: '30d' }) // Refresh token lasts longer

    // Store session
    await prisma.session.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    })

    const decodedToken = app.jwt.decode(token) as { exp: number }
    const expiresIn = decodedToken.exp - Math.floor(Date.now() / 1000)

    reply.send({
      success: true,
      message: '登录成功',
      token,
      refreshToken,
      expiresIn,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        createdAt: user.createdAt.toISOString(),
        isActive: user.isActive,
      },
    })
  })

  // Refresh Token
  app.post('/refresh-token', {
    preHandler: validateBody(refreshTokenSchema),
    schema: {
      description: 'Refresh authentication token',
      tags: ['Authentication'],
      body: {
        type: 'object',
        required: ['refreshToken'],
        properties: {
          refreshToken: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            token: { type: 'string' },
            refreshToken: { type: 'string' },
            expiresIn: { type: 'number' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                name: { type: 'string' },
                role: { type: 'string' },
                avatar: { type: 'string' },
                createdAt: { type: 'string' },
                isActive: { type: 'boolean' },
              },
            },
          },
        },
        400: { $ref: 'ErrorResponse' },
        401: { $ref: 'ErrorResponse' },
      },
    },
  }, async (request, reply) => {
    const { refreshToken } = request.body as z.infer<typeof refreshTokenSchema>

    try {
      // Verify refresh token
      const decoded = app.jwt.verify(refreshToken) as { userId: string, type?: string }

      if (decoded.type !== 'refresh') {
        return reply.code(401).send({ success: false, error: 'Invalid Token', message: '无效的刷新令牌' })
      }

      // Check if refresh token exists in DB and is not expired
      const session = await prisma.session.findFirst({
        where: {
          userId: decoded.userId,
          token: refreshToken,
          expiresAt: {
            gte: new Date(),
          },
        },
        include: { user: true },
      })

      if (!session || !session.user) {
        return reply.code(401).send({ success: false, error: 'Invalid Session', message: '会话无效或已过期，请重新登录' })
      }
      
      const user = session.user

      // Generate new access token and refresh token
      const newAccessToken = app.jwt.sign({ userId: user.id, role: user.role })
      const newRefreshToken = app.jwt.sign({ userId: user.id, type: 'refresh' }, { expiresIn: '30d' })

      // Update session with new refresh token and expiry
      await prisma.session.update({
        where: { id: session.id },
        data: {
          token: newRefreshToken,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      })

      const decodedToken = app.jwt.decode(newAccessToken) as { exp: number }
      const expiresIn = decodedToken.exp - Math.floor(Date.now() / 1000)

      reply.send({
        success: true,
        message: '令牌刷新成功',
        token: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatar: user.avatar,
          createdAt: user.createdAt.toISOString(),
          isActive: user.isActive,
        },
      })

    } catch (error: any) {
      logger.error('Refresh token error:', error)
      return reply.code(401).send({ success: false, error: 'Unauthorized', message: '刷新令牌无效或已过期' })
    }
  })

  // Get user profile
  app.get('/profile', {
    preHandler: authenticate,
    schema: {
      description: 'Get user profile',
      tags: ['Authentication'],
      security: [{ Bearer: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                name: { type: 'string' },
                role: { type: 'string' },
                avatar: { type: 'string' },
                createdAt: { type: 'string' },
                isActive: { type: 'boolean' },
              },
            },
          },
        },
        401: { $ref: 'ErrorResponse' },
        404: { $ref: 'ErrorResponse' },
      },
    },
  }, async (request, reply) => {
    // Try to get user from cache first
    let user = await cache.get(`user:${request.user.userId}`)

    if (!user) {
      user = await prisma.user.findUnique({
        where: { id: request.user.userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          avatar: true,
          createdAt: true,
          isActive: true,
        },
      })

      if (user) {
        await cache.set(`user:${user.id}`, user, 3600) // Cache for 1 hour
      }
    }

    if (!user) {
      return reply.code(404).send({
        success: false,
        error: 'User not found',
        message: 'User profile not found',
      })
    }

    reply.send({
      success: true,
      data: user,
    })
  })

  // Update profile
  app.put('/profile', {
    preHandler: [authenticate, validateBody(updateProfileSchema)],
    schema: {
      description: 'Update user profile',
      tags: ['Authentication'],
      security: [{ Bearer: [] }],
      body: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 50 },
          avatar: { type: 'string', format: 'uri' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                name: { type: 'string' },
                role: { type: 'string' },
                avatar: { type: 'string' },
                createdAt: { type: 'string' },
                isActive: { type: 'boolean' },
              },
            },
          },
        },
        400: { $ref: 'ErrorResponse' },
        401: { $ref: 'ErrorResponse' },
      },
    },
  }, async (request, reply) => {
    const { name, avatar } = request.body as z.infer<typeof updateProfileSchema>

    const updatedUser = await prisma.user.update({
      where: { id: request.user.userId },
      data: { name, avatar },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        createdAt: true,
        isActive: true,
      },
    })

    // Invalidate user cache
    await cache.del(`user:${request.user.userId}`)

    reply.send({ success: true, message: '个人资料更新成功', data: updatedUser })
  })

  // Update password
  app.put('/update-password', {
    preHandler: [authenticate, validateBody(updatePasswordSchema)],
    schema: {
      description: 'Update user password',
      tags: ['Authentication'],
      security: [{ Bearer: [] }],
      body: {
        type: 'object',
        required: ['currentPassword', 'newPassword'],
        properties: {
          currentPassword: { type: 'string' },
          newPassword: { type: 'string', minLength: 6 },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
          },
        },
        400: { $ref: 'ErrorResponse' },
        401: { $ref: 'ErrorResponse' },
      },
    },
  }, async (request, reply) => {
    const { currentPassword, newPassword } = request.body as z.infer<typeof updatePasswordSchema>

    const user = await prisma.user.findUnique({ where: { id: request.user.userId } })

    if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
      return reply.code(401).send({ success: false, error: 'Unauthorized', message: '当前密码不正确' })
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12)
    await prisma.user.update({
      where: { id: request.user.userId },
      data: { password: hashedPassword },
    })

    // Invalidate user cache
    await cache.del(`user:${request.user.userId}`)

    reply.send({ success: true, message: '密码更新成功' })
  })

  // Forgot password
  app.post('/forgot-password', {
    preHandler: validateBody(forgotPasswordSchema),
    schema: {
      description: 'Request a password reset link',
      tags: ['Authentication'],
      body: {
        type: 'object',
        required: ['email'],
        properties: {
          email: { type: 'string', format: 'email' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
          },
        },
        404: { $ref: 'ErrorResponse' },
      },
    },
  }, async (request, reply) => {
    const { email } = request.body as z.infer<typeof forgotPasswordSchema>

    const user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
      // For security reasons, always return success to avoid enumerating emails
      logger.warn(`Password reset requested for non-existent email: ${email}`)
      return reply.send({ success: true, message: '如果该邮箱存在，密码重置链接已发送到您的邮箱。' })
    }

    // Generate a one-time use reset token
    const resetToken = app.jwt.sign({ userId: user.id, type: 'password-reset' }, { expiresIn: '1h' }) // Token valid for 1 hour

    // In a real application, you would send an email here with the link:
    // `http://your-frontend-domain/reset-password/${resetToken}`
    logger.info(`Password reset link generated for ${user.email}: http://localhost:5173/reset-password/${resetToken}`)

    reply.send({ success: true, message: '如果该邮箱存在，密码重置链接已发送到您的邮箱。' })
  })

  // Reset password
  app.post('/reset-password', {
    preHandler: validateBody(resetPasswordSchema),
    schema: {
      description: 'Reset user password using a token',
      tags: ['Authentication'],
      body: {
        type: 'object',
        required: ['token', 'newPassword'],
        properties: {
          token: { type: 'string' },
          newPassword: { type: 'string', minLength: 6 },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
          },
        },
        400: { $ref: 'ErrorResponse' },
        401: { $ref: 'ErrorResponse' },
      },
    },
  }, async (request, reply) => {
    const { token, newPassword } = request.body as z.infer<typeof resetPasswordSchema>

    try {
      const decoded = app.jwt.verify(token) as { userId: string, type?: string }

      if (decoded.type !== 'password-reset') {
        return reply.code(401).send({ success: false, error: 'Invalid Token', message: '无效的重置令牌' })
      }

      const hashedPassword = await bcrypt.hash(newPassword, 12)
      await prisma.user.update({
        where: { id: decoded.userId },
        data: { password: hashedPassword },
      })

      // Invalidate user cache
      await cache.del(`user:${decoded.userId}`)
      // Invalidate all sessions for this user (force re-login after password reset)
      await prisma.session.deleteMany({
        where: { userId: decoded.userId },
      })

      reply.send({ success: true, message: '密码重置成功，请使用新密码登录。' })

    } catch (error: any) {
      logger.error('Reset password error:', error)
      if (error.name === 'TokenExpiredError') {
        return reply.code(401).send({ success: false, error: 'Token Expired', message: '重置链接已过期，请重新申请。' })
      }
      return reply.code(401).send({ success: false, error: 'Unauthorized', message: '无效或已过期的重置链接' })
    }
  })

  // Logout
  app.post('/logout', {
    preHandler: authenticate,
    schema: {
      description: 'Logout user',
      tags: ['Authentication'],
      security: [{ Bearer: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    // Get token from header
    const authHeader = request.headers.authorization
    const token = authHeader?.replace('Bearer ', '')

    if (token) {
      // Decode the token to get userId
      const decoded = app.jwt.decode(token) as { userId: string }

      // Delete the specific session token from the database
      // This ensures that only the token used for logout is invalidated
      await prisma.session.deleteMany({
        where: { token: token },
      })

      // Invalidate user cache
      if (decoded?.userId) {
        await cache.del(`user:${decoded.userId}`)
      }
    }

    reply.send({ success: true, message: '您已成功退出登录' })
  })
}
