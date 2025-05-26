import { FastifyRequest, FastifyReply } from 'fastify'
import { env } from '@/config/env'
import { logger } from '@/utils/logger'

const allowedFileTypes = env.ALLOWED_FILE_TYPES.split(',')
const maxFileSize = env.MAX_FILE_SIZE

export const validateFileUpload = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const data = await request.file()
    
    if (!data) {
      return reply.code(400).send({
        success: false,
        error: 'Bad Request',
        message: '没有找到上传的文件',
      })
    }

    // Validate file type
    const fileExtension = data.filename.split('.').pop()?.toLowerCase()
    const mimeType = data.mimetype.toLowerCase()
    
    if (!fileExtension || !allowedFileTypes.includes(fileExtension)) {
      return reply.code(400).send({
        success: false,
        error: 'Invalid File Type',
        message: `不支持的文件类型。允许的类型：${allowedFileTypes.join(', ')}`,
      })
    }

    // Check file size
    const chunks: Buffer[] = []
    let totalSize = 0
    
    for await (const chunk of data.file) {
      totalSize += chunk.length
      
      if (totalSize > maxFileSize) {
        return reply.code(400).send({
          success: false,
          error: 'File Too Large',
          message: `文件大小超过限制。最大允许：${maxFileSize / (1024 * 1024)}MB`,
        })
      }
      
      chunks.push(chunk)
    }

    // Attach file data to request for further processing
    request.fileData = {
      filename: data.filename,
      mimetype: data.mimetype,
      encoding: data.encoding,
      buffer: Buffer.concat(chunks),
      size: totalSize,
    }
  } catch (error) {
    logger.error('File upload validation error:', error)
    return reply.code(500).send({
      success: false,
      error: 'Upload Error',
      message: '文件上传处理失败',
    })
  }
}

// Extend FastifyRequest type
declare module 'fastify' {
  interface FastifyRequest {
    fileData?: {
      filename: string
      mimetype: string
      encoding: string
      buffer: Buffer
      size: number
    }
  }
}
