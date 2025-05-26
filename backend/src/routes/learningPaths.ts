import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticate } from '@/middlewares/auth'
import { validateBody, validateParams } from '@/middlewares/validation'
import { learningPathService } from '@/services/learningPathService'
import { logger } from '@/utils/logger'

const createPathSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  fileId: z.string().uuid().optional(),
  analysisId: z.string().uuid().optional(),
  nodes: z.array(z.object({
    title: z.string(),
    description: z.string(),
    type: z.enum(['CONCEPT', 'PRACTICE', 'ASSESSMENT', 'RESOURCE']),
    duration: z.number(),
    content: z.any().optional(),
    resources: z.array(z.string()).optional(),
    prerequisites: z.array(z.string()).optional(), // These could be node titles or IDs
  })),
})

const updateProgressSchema = z.object({
  nodeId: z.string().uuid(),
  completed: z.boolean(),
  timeSpent: z.number().optional(),
})

export const learningPathRoutes = async (app: FastifyInstance) => {
  // Create learning path
  app.post('/', {
    preHandler: [authenticate, validateBody(createPathSchema)],
    schema: {
      description: 'Create a new learning path',
      tags: ['Learning Paths'],
      security: [{ Bearer: [] }],
    },
  }, async (request, reply) => {
    const data = request.body as z.infer<typeof createPathSchema>
    const userId = request.user.userId
    
    try {
      const result = await learningPathService.createPath(userId, data)
      
      reply.send({
        success: true,
        message: '学习路径创建成功',
        data: result,
      })
    } catch (error: any) {
      logger.error('Create path error:', error)
      reply.code(500).send({
        success: false,
        error: 'Server Error',
        message: '创建学习路径失败',
      })
    }
  })

  // Get user's learning paths
  app.get('/', {
    preHandler: authenticate,
    schema: {
      description: 'Get user learning paths',
      tags: ['Learning Paths'],
      security: [{ Bearer: [] }],
      querystring: {
        type: 'object',
        properties: {
          includeShared: { type: 'boolean' },
        },
      },
    },
  }, async (request, reply) => {
    const { includeShared = true } = request.query as any
    const userId = request.user.userId
    
    try {
      const paths = await learningPathService.getUserPaths(userId, includeShared)
      
      reply.send({
        success: true,
        data: paths,
      })
    } catch (error: any) {
      logger.error('Get paths error:', error)
      reply.code(500).send({
        success: false,
        error: 'Server Error',
        message: '获取学习路径失败',
      })
    }
  })

  // Get learning path details
  app.get('/:pathId', {
    preHandler: authenticate,
    schema: {
      description: 'Get learning path details',
      tags: ['Learning Paths'],
      security: [{ Bearer: [] }],
      params: {
        type: 'object',
        properties: {
          pathId: { type: 'string', format: 'uuid' },
        },
      },
    },
  }, async (request, reply) => {
    const { pathId } = request.params as { pathId: string }
    const userId = request.user.userId
    
    try {
      const path = await learningPathService.getPathDetails(pathId, userId)
      
      reply.send({
        success: true,
        data: path,
      })
    } catch (error: any) {
      logger.error('Get path details error:', error)
      
      if (error.message === 'Learning path not found') {
        return reply.code(404).send({
          success: false,
          error: 'Not Found',
          message: '学习路径不存在',
        })
      }
      
      if (error.message === 'Access denied') {
        return reply.code(403).send({
          success: false,
          error: 'Forbidden',
          message: '无权访问此学习路径',
        })
      }
      
      reply.code(500).send({
        success: false,
        error: 'Server Error',
        message: '获取路径详情失败',
      })
    }
  })

  // Enroll in learning path
  app.post('/:pathId/enroll', {
    preHandler: authenticate,
    schema: {
      description: 'Enroll in a learning path',
      tags: ['Learning Paths'],
      security: [{ Bearer: [] }],
      params: {
        type: 'object',
        properties: {
          pathId: { type: 'string', format: 'uuid' },
        },
      },
    },
  }, async (request, reply) => {
    const { pathId } = request.params as { pathId: string }
    const userId = request.user.userId
    
    try {
      const progress = await learningPathService.enrollInPath(userId, pathId)
      
      reply.send({
        success: true,
        message: '成功加入学习路径',
        data: progress,
      })
    } catch (error: any) {
      logger.error('Enroll error:', error)
      
      if (error.message === 'Learning path not found') {
        return reply.code(404).send({
          success: false,
          error: 'Not Found',
          message: '学习路径不存在',
        })
      }
      
      reply.code(500).send({
        success: false,
        error: 'Server Error',
        message: '加入学习路径失败',
      })
    }
  })

  // Update node progress
  app.put('/:pathId/progress', {
    preHandler: [authenticate, validateBody(updateProgressSchema)],
    schema: {
      description: 'Update learning node progress',
      tags: ['Learning Paths'],
      security: [{ Bearer: [] }],
      params: {
        type: 'object',
        properties: {
          pathId: { type: 'string', format: 'uuid' },
        },
      },
    },
  }, async (request, reply) => {
    const { pathId } = request.params as { pathId: string }
    const { nodeId, completed, timeSpent } = request.body as z.infer<typeof updateProgressSchema>
    const userId = request.user.userId
    
    try {
      const progress = await learningPathService.updateNodeProgress({
        userId,
        pathId,
        nodeId,
        completed,
        timeSpent,
      })
      
      reply.send({
        success: true,
        message: '进度更新成功',
        data: progress,
      })
    } catch (error: any) {
      logger.error('Update progress error:', error)
      reply.code(500).send({
        success: false,
        error: 'Server Error',
        message: '更新进度失败',
      })
    }
  })
}
