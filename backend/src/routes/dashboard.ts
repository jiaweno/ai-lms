import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticate } from '@/middlewares/auth'
import { validateQuery } from '@/middlewares/validation'
import { dashboardService } from '@/services/dashboardService'
import { cache } from '@/config/redis'
import { logger } from '@/utils/logger'

const timeRangeSchema = z.object({
  range: z.enum(['today', 'week', 'month', 'all']).optional().default('week'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
})

const paginationSchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
})

export const dashboardRoutes = async (app: FastifyInstance) => {
  // Get dashboard statistics
  app.get('/stats', {
    preHandler: authenticate,
    schema: {
      description: 'Get user dashboard statistics',
      tags: ['Dashboard'],
      security: [{ Bearer: [] }],
      querystring: {
        type: 'object',
        properties: {
          range: { type: 'string', enum: ['today', 'week', 'month', 'all'] },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                totalLearningTime: { type: 'number' },
                completedCourses: { type: 'number' },
                activeDays: { type: 'number' },
                averageScore: { type: 'number' },
                currentStreak: { type: 'number' },
                achievements: { type: 'number' },
                comparisonData: {
                  type: 'object',
                  properties: {
                    timeChange: { type: 'number' },
                    coursesChange: { type: 'number' },
                    scoreChange: { type: 'number' },
                  },
                },
              },
            },
          },
        },
      },
    },
  }, async (request, reply) => {
    const { range } = request.query as z.infer<typeof timeRangeSchema>
    const userId = request.user.userId
    
    // Try cache first
    const cacheKey = `dashboard:stats:${userId}:${range}`
    const cachedData = await cache.get(cacheKey)
    
    if (cachedData) {
      return reply.send({ success: true, data: cachedData })
    }
    
    try {
      const stats = await dashboardService.getUserStats(userId, range)
      
      // Cache for 5 minutes
      await cache.set(cacheKey, stats, 300)
      
      reply.send({ success: true, data: stats })
    } catch (error) {
      logger.error('Error fetching dashboard stats:', error)
      reply.code(500).send({ 
        success: false, 
        error: 'Internal Server Error',
        message: '获取统计数据失败' 
      })
    }
  })

  // Get learning progress
  app.get('/progress', {
    preHandler: authenticate,
    schema: {
      description: 'Get user learning progress by paths',
      tags: ['Dashboard'],
      security: [{ Bearer: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                pathProgress: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      pathId: { type: 'string' },
                      pathTitle: { type: 'string' },
                      progressPercent: { type: 'number' },
                      totalDuration: { type: 'number' },
                      completedNodes: { type: 'number' },
                      totalNodes: { type: 'number' },
                      lastStudiedAt: { type: 'string' },
                    },
                  },
                },
                skillRadarData: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      skill: { type: 'string' },
                      score: { type: 'number' },
                      fullScore: { type: 'number' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  }, async (request, reply) => {
    const userId = request.user.userId
    
    try {
      const progressData = await dashboardService.getUserProgress(userId)
      reply.send({ success: true, data: progressData })
    } catch (error) {
      logger.error('Error fetching progress data:', error)
      reply.code(500).send({ 
        success: false, 
        error: 'Internal Server Error',
        message: '获取进度数据失败' 
      })
    }
  })

  // Get recent activities
  app.get('/activities', {
    preHandler: [authenticate, validateQuery(paginationSchema)],
    schema: {
      description: 'Get user recent learning activities',
      tags: ['Dashboard'],
      security: [{ Bearer: [] }],
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'number', minimum: 1 },
          limit: { type: 'number', minimum: 1, maximum: 100 },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                activities: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      type: { type: 'string' },
                      title: { type: 'string' },
                      description: { type: 'string' },
                      createdAt: { type: 'string' },
                      metadata: { type: 'object' },
                    },
                  },
                },
                pagination: {
                  type: 'object',
                  properties: {
                    page: { type: 'number' },
                    limit: { type: 'number' },
                    total: { type: 'number' },
                    totalPages: { type: 'number' },
                  },
                },
              },
            },
          },
        },
      },
    },
  }, async (request, reply) => {
    const { page, limit } = request.query as z.infer<typeof paginationSchema>
    const userId = request.user.userId
    
    try {
      const activitiesData = await dashboardService.getUserActivities(userId, page, limit)
      reply.send({ success: true, data: activitiesData })
    } catch (error) {
      logger.error('Error fetching activities:', error)
      reply.code(500).send({ 
        success: false, 
        error: 'Internal Server Error',
        message: '获取活动记录失败' 
      })
    }
  })

  // Get learning trend
  app.get('/learning-trend', {
    preHandler: [authenticate, validateQuery(timeRangeSchema)],
    schema: {
      description: 'Get user learning time trend data',
      tags: ['Dashboard'],
      security: [{ Bearer: [] }],
      querystring: {
        type: 'object',
        properties: {
          range: { type: 'string', enum: ['week', 'month', 'year'] },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                trend: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      date: { type: 'string' },
                      duration: { type: 'number' },
                      count: { type: 'number' },
                    },
                  },
                },
                summary: {
                  type: 'object',
                  properties: {
                    totalDuration: { type: 'number' },
                    averageDuration: { type: 'number' },
                    peakDay: { type: 'string' },
                    peakDuration: { type: 'number' },
                  },
                },
              },
            },
          },
        },
      },
    },
  }, async (request, reply) => {
    const { range } = request.query as z.infer<typeof timeRangeSchema>
    const userId = request.user.userId
    
    // Cache key includes range
    const cacheKey = `dashboard:trend:${userId}:${range}`
    const cachedData = await cache.get(cacheKey)
    
    if (cachedData) {
      return reply.send({ success: true, data: cachedData })
    }
    
    try {
      const trendData = await dashboardService.getLearningTrend(userId, range || 'week')
      
      // Cache for 10 minutes
      await cache.set(cacheKey, trendData, 600)
      
      reply.send({ success: true, data: trendData })
    } catch (error) {
      logger.error('Error fetching learning trend:', error)
      reply.code(500).send({ 
        success: false, 
        error: 'Internal Server Error',
        message: '获取学习趋势失败' 
      })
    }
  })
}
