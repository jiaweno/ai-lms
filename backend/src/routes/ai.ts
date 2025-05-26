import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticate } from '@/middlewares/auth'
import { validateBody, validateParams } from '@/middlewares/validation'
import { aiAnalysisQueue, documentProcessingQueue } from '@/config/queue'
import { aiAnalysisService } from '@/services/aiAnalysisService'
import { learningPathService } from '@/services/learningPathService'
import { prisma } from '@/config/database'
import { logger } from '@/utils/logger'

const analyzeDocumentSchema = z.object({
  fileId: z.string().uuid(),
  options: z.object({
    generatePaths: z.boolean().optional().default(true),
    extractKeywords: z.boolean().optional().default(true),
    analyzeDepth: z.enum(['basic', 'detailed', 'comprehensive']).optional().default('detailed'),
  }).optional(),
})

const generatePathSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  knowledgePoints: z.array(z.object({
    title: z.string(),
    description: z.string(),
    difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']),
    estimatedTime: z.number(),
  })),
  targetAudience: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
})

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
    prerequisites: z.array(z.string()).optional(),
  })),
})

export const aiRoutes = async (app: FastifyInstance) => {
  // Analyze document
  app.post('/analyze-document', {
    preHandler: [authenticate, validateBody(analyzeDocumentSchema)],
    schema: {
      description: 'Analyze a document using AI',
      tags: ['AI'],
      security: [{ Bearer: [] }],
      body: {
        type: 'object',
        required: ['fileId'],
        properties: {
          fileId: { type: 'string', format: 'uuid' },
          options: {
            type: 'object',
            properties: {
              generatePaths: { type: 'boolean' },
              extractKeywords: { type: 'boolean' },
              analyzeDepth: { type: 'string', enum: ['basic', 'detailed', 'comprehensive'] },
            },
          },
        },
      },
      response: {
        202: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            jobId: { type: 'string' },
            statusUrl: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    const { fileId, options } = request.body as z.infer<typeof analyzeDocumentSchema>
    const userId = request.user.userId
    
    try {
      // Check file ownership
      const file = await prisma.fileUpload.findFirst({
        where: {
          id: fileId,
          userId,
        },
      })
      
      if (!file) {
        return reply.code(404).send({
          success: false,
          error: 'Not Found',
          message: '文件不存在或无权访问',
        })
      }
      
      // Check if already analyzed
      const existingAnalysis = await prisma.aIAnalysis.findFirst({
        where: {
          fileId,
          status: 'COMPLETED',
        },
        orderBy: { createdAt: 'desc' },
      })
      
      if (existingAnalysis) {
        return reply.send({
          success: true,
          message: '该文件已经分析过了',
          analysisId: existingAnalysis.id,
          results: {
            knowledgePoints: existingAnalysis.knowledgePoints,
            suggestedPaths: existingAnalysis.suggestedPaths,
          },
        })
      }
      
      // Add to queue
      const job = await aiAnalysisQueue.add('analyze-document', {
        fileId,
        userId,
        options,
      })
      
      reply.code(202).send({
        success: true,
        message: 'AI分析任务已创建，正在处理中',
        jobId: job.id,
        statusUrl: `/api/ai/analysis-status/${job.id}`,
      })
    } catch (error: any) {
      logger.error('Document analysis error:', error)
      reply.code(500).send({
        success: false,
        error: 'Server Error',
        message: '创建分析任务失败',
      })
    }
  })

  // Get analysis status
  app.get('/analysis-status/:jobId', {
    preHandler: authenticate,
    schema: {
      description: 'Get AI analysis job status',
      tags: ['AI'],
      security: [{ Bearer: [] }],
      params: {
        type: 'object',
        properties: {
          jobId: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            status: { type: 'string' },
            progress: { type: 'number' },
            result: { type: 'object' },
            error: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    const { jobId } = request.params as { jobId: string }
    
    try {
      const job = await aiAnalysisQueue.getJob(jobId)
      
      if (!job) {
        return reply.code(404).send({
          success: false,
          error: 'Not Found',
          message: '任务不存在',
        })
      }
      
      const state = await job.getState()
      const progress = job.progress()
      
      const response: any = {
        success: true,
        status: state,
        progress,
      }
      
      if (state === 'completed') {
        response.result = job.returnvalue
      } else if (state === 'failed') {
        response.error = job.failedReason
      }
      
      reply.send(response)
    } catch (error: any) {
      logger.error('Get job status error:', error)
      reply.code(500).send({
        success: false,
        error: 'Server Error',
        message: '获取任务状态失败',
      })
    }
  })

  // Generate learning path from knowledge points
  app.post('/generate-path', {
    preHandler: [authenticate, validateBody(generatePathSchema)],
    schema: {
      description: 'Generate learning path from knowledge points',
      tags: ['AI'],
      security: [{ Bearer: [] }],
      body: {
        type: 'object',
        required: ['title', 'knowledgePoints'],
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          knowledgePoints: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                description: { type: 'string' },
                difficulty: { type: 'string' },
                estimatedTime: { type: 'number' },
              },
            },
          },
          targetAudience: { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {
    const data = request.body as z.infer<typeof generatePathSchema>
    const userId = request.user.userId
    
    try {
      const paths = await aiAnalysisService.generateLearningPaths(
        data.knowledgePoints as any,
        data.title
      )
      
      reply.send({
        success: true,
        data: paths,
      })
    } catch (error: any) {
      logger.error('Generate path error:', error)
      reply.code(500).send({
        success: false,
        error: 'Server Error',
        message: '生成学习路径失败',
      })
    }
  })

  // Get AI analysis history
  app.get('/analyses', {
    preHandler: authenticate,
    schema: {
      description: 'Get user AI analysis history',
      tags: ['AI'],
      security: [{ Bearer: [] }],
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'number' },
          limit: { type: 'number' },
        },
      },
    },
  }, async (request, reply) => {
    const { page = 1, limit = 20 } = request.query as any
    const userId = request.user.userId
    
    try {
      const skip = (page - 1) * limit
      
      const [analyses, total] = await Promise.all([
        prisma.aIAnalysis.findMany({
          where: { userId },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            file: {
              select: {
                id: true,
                originalName: true,
                size: true,
              },
            },
          },
        }),
        prisma.aIAnalysis.count({ where: { userId } }),
      ])
      
      reply.send({
        success: true,
        data: {
          analyses,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        },
      })
    } catch (error: any) {
      logger.error('Get analyses error:', error)
      reply.code(500).send({
        success: false,
        error: 'Server Error',
        message: '获取分析历史失败',
      })
    }
  })
}
