import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticate, authorize } from '@/middlewares/auth' // Assuming authorize is from DAY2
import { validateBody, validateQuery, validateParams } from '@/middlewares/validation'
import { questionService } from '@/services/questionService'
import { logger } from '@/utils/logger'

const createQuestionSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.any(), // Rich text content
  type: z.enum(['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE', 'FILL_BLANK', 'ESSAY']),
  difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).optional(),
  points: z.number().min(1).max(100).optional(),
  timeLimit: z.number().optional(),
  explanation: z.string().optional(),
  tags: z.array(z.string()).optional(),
  options: z.array(z.object({
    content: z.string(),
    isCorrect: z.boolean(),
    explanation: z.string().optional(),
  })).optional(),
})

const queryQuestionsSchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  type: z.enum(['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE', 'FILL_BLANK', 'ESSAY']).optional(),
  difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).optional(),
  tag: z.string().optional(),
  search: z.string().optional(),
})

const batchImportSchema = z.object({
  questions: z.array(createQuestionSchema),
})

export const questionRoutes = async (app: FastifyInstance) => {
  // 创建题目
  app.post('/', {
    preHandler: [authenticate, authorize(['TEACHER', 'ADMIN']), validateBody(createQuestionSchema)],
    schema: {
      description: 'Create a new question',
      tags: ['Questions'],
      security: [{ Bearer: [] }],
      body: {
        type: 'object',
        required: ['title', 'content', 'type'],
        properties: {
          title: { type: 'string' },
          content: { type: 'object' }, // Flexible for JSON content
          type: { type: 'string', enum: ['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE', 'FILL_BLANK', 'ESSAY'] },
          difficulty: { type: 'string', enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] },
          points: { type: 'number' },
          timeLimit: { type: 'number' },
          explanation: { type: 'string' },
          tags: { type: 'array', items: { type: 'string' } },
          options: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                content: { type: 'string' },
                isCorrect: { type: 'boolean' },
                explanation: { type: 'string' },
              },
            },
          },
        },
      },
    },
  }, async (request, reply) => {
    const data = request.body as z.infer<typeof createQuestionSchema>
    const userId = request.user.userId

    try {
      const question = await questionService.createQuestion(userId, data)
      
      reply.send({
        success: true,
        message: '题目创建成功',
        data: question,
      })
    } catch (error: any) {
      logger.error('Create question error:', error)
      reply.code(500).send({
        success: false,
        error: 'Server Error',
        message: '创建题目失败',
      })
    }
  })

  // 获取题目列表
  app.get('/', {
    preHandler: [authenticate, validateQuery(queryQuestionsSchema)],
    schema: {
      description: 'Get questions list',
      tags: ['Questions'],
      security: [{ Bearer: [] }],
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'number' },
          limit: { type: 'number' },
          type: { type: 'string' },
          difficulty: { type: 'string' },
          tag: { type: 'string' },
          search: { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {
    const params = request.query as z.infer<typeof queryQuestionsSchema>

    try {
      const result = await questionService.getQuestions(params)
      
      reply.send({
        success: true,
        data: result,
      })
    } catch (error: any) {
      logger.error('Get questions error:', error)
      reply.code(500).send({
        success: false,
        error: 'Server Error',
        message: '获取题目列表失败',
      })
    }
  })

  // 获取单个题目详情
  app.get('/:id', {
    preHandler: [authenticate, validateParams(z.object({ id: z.string().uuid() }))],
    schema: {
      description: 'Get question details',
      tags: ['Questions'],
      security: [{ Bearer: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
        },
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string }

    try {
      const question = await questionService.getQuestionById(id)
      
      if (!question) {
        return reply.code(404).send({
          success: false,
          error: 'Not Found',
          message: '题目不存在',
        })
      }

      reply.send({
        success: true,
        data: question,
      })
    } catch (error: any) {
      logger.error('Get question error:', error)
      reply.code(500).send({
        success: false,
        error: 'Server Error',
        message: '获取题目详情失败',
      })
    }
  })

  // 更新题目
  app.put('/:id', {
    preHandler: [
      authenticate,
      authorize(['TEACHER', 'ADMIN']),
      validateParams(z.object({ id: z.string().uuid() })),
      validateBody(createQuestionSchema.partial()),
    ],
    schema: {
      description: 'Update question',
      tags: ['Questions'],
      security: [{ Bearer: [] }],
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const data = request.body as Partial<z.infer<typeof createQuestionSchema>>
    const userId = request.user.userId

    try {
      const question = await questionService.updateQuestion(id, userId, data)
      
      reply.send({
        success: true,
        message: '题目更新成功',
        data: question,
      })
    } catch (error: any) {
      logger.error('Update question error:', error)
      
      if (error.message === 'Question not found') {
        return reply.code(404).send({
          success: false,
          error: 'Not Found',
          message: '题目不存在',
        })
      }
      
      if (error.message === 'Access denied') {
        return reply.code(403).send({
          success: false,
          error: 'Forbidden',
          message: '无权限修改此题目',
        })
      }

      reply.code(500).send({
        success: false,
        error: 'Server Error',
        message: '更新题目失败',
      })
    }
  })

  // 删除题目
  app.delete('/:id', {
    preHandler: [
      authenticate,
      authorize(['TEACHER', 'ADMIN']),
      validateParams(z.object({ id: z.string().uuid() })),
    ],
    schema: {
      description: 'Delete question',
      tags: ['Questions'],
      security: [{ Bearer: [] }],
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const userId = request.user.userId

    try {
      await questionService.deleteQuestion(id, userId)
      
      reply.send({
        success: true,
        message: '题目删除成功',
      })
    } catch (error: any) {
      logger.error('Delete question error:', error)
      
      if (error.message === 'Question not found') {
        return reply.code(404).send({
          success: false,
          error: 'Not Found',
          message: '题目不存在',
        })
      }
      
      if (error.message === 'Access denied') {
        return reply.code(403).send({
          success: false,
          error: 'Forbidden',
          message: '无权限删除此题目',
        })
      }

      reply.code(500).send({
        success: false,
        error: 'Server Error',
        message: '删除题目失败',
      })
    }
  })

  // 批量导入题目
  app.post('/batch-import', {
    preHandler: [
      authenticate,
      authorize(['TEACHER', 'ADMIN']),
      validateBody(batchImportSchema),
    ],
    schema: {
      description: 'Batch import questions',
      tags: ['Questions'],
      security: [{ Bearer: [] }],
    },
  }, async (request, reply) => {
    const { questions } = request.body as z.infer<typeof batchImportSchema>
    const userId = request.user.userId

    try {
      const result = await questionService.batchImportQuestions(userId, questions)
      
      reply.send({
        success: true,
        message: '题目批量导入成功',
        data: result,
      })
    } catch (error: any) {
      logger.error('Batch import error:', error)
      reply.code(500).send({
        success: false,
        error: 'Server Error',
        message: '批量导入失败',
      })
    }
  })

  // 获取题目统计
  app.get('/stats/overview', {
    preHandler: [authenticate],
    schema: {
      description: 'Get questions statistics',
      tags: ['Questions'],
      security: [{ Bearer: [] }],
    },
  }, async (request, reply) => {
    try {
      const stats = await questionService.getQuestionStats()
      
      reply.send({
        success: true,
        data: stats,
      })
    } catch (error: any) {
      logger.error('Get question stats error:', error)
      reply.code(500).send({
        success: false,
        error: 'Server Error',
        message: '获取统计信息失败',
      })
    }
  })
}
