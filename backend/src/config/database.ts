import { PrismaClient } from '@prisma/client'
import { logger } from '@/utils/logger'

export const prisma = new PrismaClient({
  log: [
    { level: 'query', emit: 'event' },
    { level: 'error', emit: 'event' },
    { level: 'info', emit: 'event' },
    { level: 'warn', emit: 'event' },
  ],
})

// Log Prisma queries (optional, for debugging)
prisma.$on('query', (e) => {
  if (process.env.NODE_ENV === 'development') {
    logger.debug(`Prisma Query: ${e.query} Params: ${e.params} Duration: ${e.duration}ms`)
  }
})

prisma.$on('error', (e) => {
  logger.error(`Prisma Error: ${e.message}`)
})

prisma.$on('info', (e) => {
  logger.info(`Prisma Info: ${e.message}`)
})

prisma.$on('warn', (e) => {
  logger.warn(`Prisma Warn: ${e.message}`)
})

// Connect to database on startup
export const connectDb = async () => {
  try {
    await prisma.$connect()
    logger.info('📦 Connected to PostgreSQL database.')
  } catch (error) {
    logger.error('❌ Failed to connect to database:', error)
    process.exit(1)
  }
}

connectDb()
