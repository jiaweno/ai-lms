import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticate, authorize } from '@/middlewares/auth' // Assuming authorize is from DAY2
import { validateBody, validateQuery, validateParams } from '@/middlewares/validation'
import { examService } from '@/services/examService'
import { logger } from '@/utils/logger'

const createExamSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  type: z.enum(['CHAPTER_TEST', 'MOCK_EXAM', 'REAL_EXAM', 'PRACTICE']),
  timeLimit: z.number().optional(),
  passingScore: z.number().optional(),
  maxAttempts: z.number().min(1).optional(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  settings: z.any().optional(),
  questionIds: z.array(z.string().uuid()).min(1),
})

const queryExamsSchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  type: z.enum(['CHAPTER_TEST', 'MOCK_EXAM', 'REAL_EXAM', 'PRACTICE']).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ACTIVE', 'ENDED', 'CANCELLED']).optional(),
  search: z.string().optional(),
})

const submitAnswerSchema = z.object({
  questionId: z.string().uuid(),
  content: z.any(), // 答案内容，支持多种格式
  timeSpent: z.number().optional(),
})

const batchSubmitSchema = z.object({
  answers: z.array(submitAnswerSchema),
})

export const examRoutes = async (app: FastifyInstance) => {
  // 创建考试
  app.post('/', {
    preHandler: [authenticate, authorize(['TEACHER', 'ADMIN']), validateBody(createExamSchema)],
    schema: {
      description: 'Create a new exam',
      tags: ['Exams'],
      security: [{ Bearer: [] }],
    },
  }, async (request, reply) => {
    const data = request.body as z.infer<typeof createExamSchema>
    const userId = request.user.userId

    try {
      const exam = await examService.createExam(userId, data)
      
      reply.send({
        success: true,
        message: '考试创建成功',
        data: exam,
      })
    } catch (error: any) {
      logger.error('Create exam error:', error)
      reply.code(500).send({
        success: false,
        error: 'Server Error',
        message: '创建考试失败',
      })
    }
  })

  // 获取考试列表
  app.get('/', {
    preHandler: [authenticate, validateQuery(queryExamsSchema)],
    schema: {
      description: 'Get exams list',
      tags: ['Exams'],
      security: [{ Bearer: [] }],
    },
  }, async (request, reply) => {
    const params = request.query as z.infer<typeof queryExamsSchema>
    const userId = request.user.userId
    const userRole = request.user.role

    try {
      const result = await examService.getExams(userId, userRole, params)
      
      reply.send({
        success: true,
        data: result,
      })
    } catch (error: any) {
      logger.error('Get exams error:', error)
      reply.code(500).send({
        success: false,
        error: 'Server Error',
        message: '获取考试列表失败',
      })
    }
  })

  // 获取考试详情
  app.get('/:id', {
    preHandler: [authenticate, validateParams(z.object({ id: z.string().uuid() }))],
    schema: {
      description: 'Get exam details',
      tags: ['Exams'],
      security: [{ Bearer: [] }],
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const userId = request.user.userId

    try {
      const exam = await examService.getExamById(id, userId)
      
      if (!exam) {
        return reply.code(404).send({
          success: false,
          error: 'Not Found',
          message: '考试不存在',
        })
      }

      reply.send({
        success: true,
        data: exam,
      })
    } catch (error: any) {
      logger.error('Get exam error:', error)
      reply.code(500).send({
        success: false,
        error: 'Server Error',
        message: '获取考试详情失败',
      })
    }
  })

  // 开始考试
  app.post('/:id/start', {
    preHandler: [authenticate, validateParams(z.object({ id: z.string().uuid() }))],
    schema: {
      description: 'Start exam',
      tags: ['Exams'],
      security: [{ Bearer: [] }],
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const userId = request.user.userId
    const ipAddress = request.ip
    const userAgent = request.headers['user-agent']

    try {
      const examRecord = await examService.startExam(id, userId, {
        ipAddress,
        userAgent,
      })
      
      reply.send({
        success: true,
        message: '考试开始',
        data: examRecord,
      })
    } catch (error: any) {
      logger.error('Start exam error:', error)
      
      if (error.message === 'Exam not found') {
        return reply.code(404).send({
          success: false,
          error: 'Not Found',
          message: '考试不存在',
        })
      }
      
      if (error.message === 'Exam not available') {
        return reply.code(400).send({
          success: false,
          error: 'Bad Request',
          message: '考试当前不可用',
        })
      }
      
      if (error.message === 'Max attempts exceeded') {
        return reply.code(400).send({
          success: false,
          error: 'Bad Request',
          message: '已超过最大尝试次数',
        })
      }

      reply.code(500).send({
        success: false,
        error: 'Server Error',
        message: '开始考试失败',
      })
    }
  })

  // 提交单个答案
  app.post('/:id/answer', {
    preHandler: [authenticate, validateParams(z.object({ id: z.string().uuid() })), validateBody(submitAnswerSchema)],
    schema: {
      description: 'Submit answer for a question',
      tags: ['Exams'],
      security: [{ Bearer: [] }],
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const answerData = request.body as z.infer<typeof submitAnswerSchema>
    const userId = request.user.userId

    try {
      const answer = await examService.submitAnswer(id, userId, answerData)
      
      reply.send({
        success: true,
        message: '答案提交成功',
        data: answer,
      })
    } catch (error: any) {
      logger.error('Submit answer error:', error)
      reply.code(500).send({
        success: false,
        error: 'Server Error',
        message: '提交答案失败',
      })
    }
  })

  // 批量提交答案
  app.post('/:id/batch-answer', {
    preHandler: [authenticate, validateParams(z.object({ id: z.string().uuid() })), validateBody(batchSubmitSchema)],
    schema: {
      description: 'Batch submit answers',
      tags: ['Exams'],
      security: [{ Bearer: [] }],
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const { answers } = request.body as z.infer<typeof batchSubmitSchema>
    const userId = request.user.userId

    try {
      const result = await examService.batchSubmitAnswers(id, userId, answers)
      
      reply.send({
        success: true,
        message: '答案批量提交成功',
        data: result,
      })
    } catch (error: any) {
      logger.error('Batch submit answers error:', error)
      reply.code(500).send({
        success: false,
        error: 'Server Error',
        message: '批量提交答案失败',
      })
    }
  })

  // 完成考试
  app.post('/:id/finish', {
    preHandler: [authenticate, validateParams(z.object({ id: z.string().uuid() }))],
    schema: {
      description: 'Finish exam',
      tags: ['Exams'],
      security: [{ Bearer: [] }],
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const userId = request.user.userId

    try {
      const result = await examService.finishExam(id, userId)
      
      reply.send({
        success: true,
        message: '考试完成',
        data: result,
      })
    } catch (error: any) {
      logger.error('Finish exam error:', error)
      reply.code(500).send({
        success: false,
        error: 'Server Error',
        message: '完成考试失败',
      })
    }
  })

  // 获取考试结果
  app.get('/:id/result', {
    preHandler: [authenticate, validateParams(z.object({ id: z.string().uuid() }))],
    schema: {
      description: 'Get exam result',
      tags: ['Exams'],
      security: [{ Bearer: [] }],
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const userId = request.user.userId

    try {
      const result = await examService.getExamResult(id, userId)
      
      if (!result) {
        return reply.code(404).send({
          success: false,
          error: 'Not Found',
          message: '考试记录不存在',
        })
      }

      reply.send({
        success: true,
        data: result,
      })
    } catch (error: any) {
      logger.error('Get exam result error:', error)
      reply.code(500).send({
        success: false,
        error: 'Server Error',
        message: '获取考试结果失败',
      })
    }
  })

  // 获取考试统计
  app.get('/:id/stats', {
    preHandler: [authenticate, authorize(['TEACHER', 'ADMIN']), validateParams(z.object({ id: z.string().uuid() }))],
    schema: {
      description: 'Get exam statistics',
      tags: ['Exams'],
      security: [{ Bearer: [] }],
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string }

    try {
      const stats = await examService.getExamStats(id)
      
      reply.send({
        success: true,
        data: stats,
      })
    } catch (error: any) {
      logger.error('Get exam stats error:', error)
      reply.code(500).send({
        success: false,
        error: 'Server Error',
        message: '获取考试统计失败',
      })
    }
  })

  // 发布考试
  app.post('/:id/publish', {
    preHandler: [authenticate, authorize(['TEACHER', 'ADMIN']), validateParams(z.object({ id: z.string().uuid() }))],
    schema: {
      description: 'Publish exam',
      tags: ['Exams'],
      security: [{ Bearer: [] }],
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const userId = request.user.userId

    try {
      const exam = await examService.publishExam(id, userId)
      
      reply.send({
        success: true,
        message: '考试发布成功',
        data: exam,
      })
    } catch (error: any) {
      logger.error('Publish exam error:', error)
      reply.code(500).send({
        success: false,
        error: 'Server Error',
        message: '发布考试失败',
      })
    }
  })
}
