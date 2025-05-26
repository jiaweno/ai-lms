import Fastify from 'fastify'
import { env } from '@/config/env'
import { logger } from '@/utils/logger'
import { setupPlugins } from '@/config/plugins'
import { setupRoutes } from '@/routes'
import { errorHandler } from '@/middlewares/error'
import { prisma } from '@/config/database'
import { redis, initializeRedis } from '@/config/redis' // initializeRedis might be new if not in DAY1
import { initializeMinio } from '@/config/minio' // Added in DAY4
import { startQueueProcessors } from '@/config/queue' // Added in DAY5

// Create Fastify instance
export const app = Fastify({
  logger: env.NODE_ENV === 'development' ? {
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    },
  } : true, 
})

// Initialize connections and services
async function initializeServices() {
  await initializeRedis() // Assuming this function now exists in redis.ts
  await initializeMinio() // From DAY4
  await startQueueProcessors() // From DAY5
  logger.info('Essential services initialized.')
}

initializeServices().catch(err => {
  logger.error('Failed to initialize services:', err)
  process.exit(1)
})

// Register plugins
setupPlugins(app)

// Register routes
setupRoutes(app)

// Register error handler
app.setErrorHandler(errorHandler)

// Hook to close Prisma and Redis connections on shutdown
app.addHook('onClose', async (instance) => {
  logger.info('Shutting down: Closing database and Redis connections...')
  await prisma.$disconnect()
  if (redis.status === 'ready') { // Check if redis is connected before quitting
    await redis.quit()
  }
  logger.info('Database and Redis connections closed.')
})
