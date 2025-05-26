import { app } from './app'
import { env } from '@/config/env'
import { logger } from '@/utils/logger'

const start = async () => {
  try {
    await app.listen({
      port: env.PORT,
      host: env.HOST
    })
    
    logger.info(`🚀 Server running on http://${env.HOST}:${env.PORT}`)
    logger.info(`📚 API Documentation: http://${env.HOST}:${env.PORT}/docs`)
    logger.info(`🔍 Environment: ${env.NODE_ENV}`)
  } catch (err) {
    logger.error('❌ Error starting server:', err)
    process.exit(1)
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...')
  await app.close()
  process.exit(0)
})

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully...')
  await app.close()
  process.exit(0)
})

start()
