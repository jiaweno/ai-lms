import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticate, authorize } from '@/middlewares/auth'
import { validateFileUpload } from '@/middlewares/upload'
import { validateQuery, validateBody } from '@/middlewares/validation'
import { fileService } from '@/services/fileService'
import { logger } from '@/utils/logger'

const fileListSchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  category: z.string().optional(),
  tag: z.string().optional(),
  search: z.string().optional(),
  sortBy: z.enum(['name', 'size', 'createdAt']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
})

const batchDeleteSchema = z.object({
  fileIds: z.array(z.string().uuid()).min(1).max(100),
})

export const fileRoutes = async (app: FastifyInstance) => {
  // Upload file
  app.post('/upload', {
    preHandler: [authenticate, validateFileUpload],
    schema: {
      description: 'Upload a file',
      tags: ['Files'],
      security: [{ Bearer: [] }],
      consumes: ['multipart/form-data'],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            file: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                filename: { type: 'string' },
                originalName: { type: 'string' },
                mimetype: { type: 'string' },
                size: { type: 'number' },
                url: { type: 'string' },
                createdAt: { type: 'string' },
              },
            },
          },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const fileData = request.fileData!
      const userId = request.user.userId

      const file = await fileService.uploadFile({
        fileData,
        userId,
        description: request.body?.description,
        categoryId: request.body?.categoryId,
        tags: request.body?.tags,
      })

      reply.send({
        success: true,
        message: '文件上传成功',
        file,
      })
    } catch (error: any) {
      logger.error('File upload error:', error)
      reply.code(500).send({
        success: false,
        error: 'Upload Failed',
        message: error.message || '文件上传失败',
      })
    }
  })

  // Get file list
  app.get('/', {
    preHandler: [authenticate, validateQuery(fileListSchema)],
    schema: {
      description: 'Get user files',
      tags: ['Files'],
      security: [{ Bearer: [] }],
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'number' },
          limit: { type: 'number' },
          category: { type: 'string' },
          tag: { type: 'string' },
          search: { type: 'string' },
          sortBy: { type: 'string' },
          sortOrder: { type: 'string' },
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
                files: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      filename: { type: 'string' },
                      originalName: { type: 'string' },
                      mimetype: { type: 'string' },
                      size: { type: 'number' },
                      url: { type: 'string' },
                      category: { type: 'object' },
                      tags: { type: 'array' },
                      downloadCount: { type: 'number' },
                      createdAt: { type: 'string' },
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
    const userId = request.user.userId
    const params = request.query as z.infer<typeof fileListSchema>

    try {
      const result = await fileService.getFiles({
        userId,
        ...params,
      })

      reply.send({
        success: true,
        data: result,
      })
    } catch (error: any) {
      logger.error('Get files error:', error)
      reply.code(500).send({
        success: false,
        error: 'Server Error',
        message: '获取文件列表失败',
      })
    }
  })

  // Get single file
  app.get('/:id', {
    preHandler: authenticate,
    schema: {
      description: 'Get file details',
      tags: ['Files'],
      security: [{ Bearer: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
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
                id: { type: 'string' },
                filename: { type: 'string' },
                originalName: { type: 'string' },
                mimetype: { type: 'string' },
                size: { type: 'number' },
                url: { type: 'string' },
                description: { type: 'string' },
                category: { type: 'object' },
                tags: { type: 'array' },
                downloadCount: { type: 'number' },
                createdAt: { type: 'string' },
                updatedAt: { type: 'string' },
              },
            },
          },
        },
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const userId = request.user.userId

    try {
      const file = await fileService.getFileById(id, userId)

      if (!file) {
        return reply.code(404).send({
          success: false,
          error: 'Not Found',
          message: '文件不存在或无权访问',
        })
      }

      reply.send({
        success: true,
        data: file,
      })
    } catch (error: any) {
      logger.error('Get file error:', error)
      reply.code(500).send({
        success: false,
        error: 'Server Error',
        message: '获取文件信息失败',
      })
    }
  })

  // Delete file
  app.delete('/:id', {
    preHandler: authenticate,
    schema: {
      description: 'Delete a file',
      tags: ['Files'],
      security: [{ Bearer: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const userId = request.user.userId

    try {
      await fileService.deleteFile(id, userId)

      reply.send({
        success: true,
        message: '文件删除成功',
      })
    } catch (error: any) {
      logger.error('Delete file error:', error)
      reply.code(500).send({
        success: false,
        error: 'Server Error',
        message: error.message || '文件删除失败',
      })
    }
  })

  // Download file
  app.get('/:id/download', {
    preHandler: authenticate,
    schema: {
      description: 'Download a file',
      tags: ['Files'],
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
    const userId = request.user.userId

    try {
      const { stream, filename, mimetype } = await fileService.downloadFile(id, userId)

      reply
        .header('Content-Type', mimetype)
        .header('Content-Disposition', `attachment; filename="${filename}"`)
        .send(stream)
    } catch (error: any) {
      logger.error('Download file error:', error)
      reply.code(500).send({
        success: false,
        error: 'Server Error',
        message: error.message || '文件下载失败',
      })
    }
  })

  // Batch delete files
  app.post('/batch-delete', {
    preHandler: [authenticate, validateBody(batchDeleteSchema)],
    schema: {
      description: 'Delete multiple files',
      tags: ['Files'],
      security: [{ Bearer: [] }],
      body: {
        type: 'object',
        required: ['fileIds'],
        properties: {
          fileIds: {
            type: 'array',
            items: { type: 'string', format: 'uuid' },
            minItems: 1,
            maxItems: 100,
          },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            deleted: { type: 'number' },
            failed: { type: 'number' },
          },
        },
      },
    },
  }, async (request, reply) => {
    const { fileIds } = request.body as z.infer<typeof batchDeleteSchema>
    const userId = request.user.userId

    try {
      const result = await fileService.batchDelete(fileIds, userId)

      reply.send({
        success: true,
        message: '批量删除完成',
        ...result,
      })
    } catch (error: any) {
      logger.error('Batch delete error:', error)
      reply.code(500).send({
        success: false,
        error: 'Server Error',
        message: '批量删除失败',
      })
    }
  })
}
