import { FastifyInstance } from 'fastify'
import { prisma } from '@/config/database'
import { redis } from '@/config/redis'

export const healthRoutes = async (app: FastifyInstance) => {
  // Basic health check
  app.get('/health', {
    schema: {
      description: 'Health check endpoint',
      tags: ['Health'],
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            timestamp: { type: 'string' },
            uptime: { type: 'number' },
            services: {
              type: 'object',
              properties: {
                database: { type: 'string' },
                redis: { type: 'string' },
              },
            },
          },
        },
      },
    },
  }, async (request, reply) => {
    try {
      // Check database connection
      await prisma.$queryRaw`SELECT 1`
      
      // Check Redis connection
      await redis.ping()
      
      reply.send({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        services: {
          database: 'ok',
          redis: 'ok',
        },
      })
    } catch (error: any) {
      reply.code(500).send({
        status: 'error',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        services: {
          database: error.message.includes('timeout') ? 'timeout' : 'error',
          redis: error.message.includes('timeout') ? 'timeout' : 'error',
        },
        message: 'One or more services are unhealthy.',
        details: error.message,
      })
    }
  })
}
