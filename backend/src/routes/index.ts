import { FastifyInstance } from 'fastify'
import { healthRoutes } from './health'
import { authRoutes } from './auth'
import { dashboardRoutes } from './dashboard'
import { fileRoutes } from './files' 
import { aiRoutes } from './ai' 
import { learningPathRoutes } from './learningPaths' 
import { questionRoutes } from './questions' // Added in DAY6
import { examRoutes } from './exams' // Added in DAY6

export const setupRoutes = async (app: FastifyInstance) => {
  // Register all routes with /api prefix
  await app.register(async function (fastify) {
    await fastify.register(healthRoutes)
    await fastify.register(authRoutes, { prefix: '/auth' })
    await fastify.register(dashboardRoutes, { prefix: '/dashboard' })
    await fastify.register(fileRoutes, { prefix: '/files' }) 
    await fastify.register(aiRoutes, { prefix: '/ai' }) 
    await fastify.register(learningPathRoutes, { prefix: '/learning-paths' }) 
    await fastify.register(questionRoutes, { prefix: '/questions' }) // Added in DAY6
    await fastify.register(examRoutes, { prefix: '/exams' }) // Added in DAY6
    // More routes will be added here
  }, { prefix: '/api' })
}
