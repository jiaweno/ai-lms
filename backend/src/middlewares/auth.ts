import { FastifyReply, FastifyRequest } from 'fastify'
import { env } from '@/config/env'
import { logger } from '@/utils/logger'

// Extend FastifyRequest with user property
declare module 'fastify' {
  interface FastifyRequest {
    user: {
      userId: string
      role: string
    }
  }
}

export const authenticate = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    await request.jwtVerify()
  } catch (err) {
    logger.warn(`Authentication failed: ${(err as Error).message}`)
    reply.code(401).send({ success: false, error: 'Unauthorized', message: '认证失败或令牌无效' })
  }
}
