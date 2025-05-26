import { prisma } from '@/config/database'
import { fileOperations } from '@/config/minio'
import { env } from '@/config/env'
import { logger } from '@/utils/logger'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'
import crypto from 'crypto'

interface UploadFileParams {
  fileData: {
    filename: string
    mimetype: string
    buffer: Buffer
    size: number
  }
  userId: string
  description?: string
  categoryId?: string
  tags?: string[]
}

interface GetFilesParams {
  userId: string
  page: number
  limit: number
  category?: string
  tag?: string
  search?: string
  sortBy: string
  sortOrder: 'asc' | 'desc'
}

export const fileService = {
  async uploadFile(params: UploadFileParams) {
    const { fileData, userId, description, categoryId, tags } = params
    
    // Generate unique object name
    const fileExtension = path.extname(fileData.filename)
    const fileHash = crypto.createHash('md5').update(fileData.buffer).digest('hex')
    const objectName = `${userId}/${uuidv4()}-${fileHash}${fileExtension}`
    
    try {
      // Check if file already exists (by hash)
      const existingFile = await prisma.fileUpload.findFirst({
        where: {
          userId,
          objectName: {
            contains: fileHash,
          },
        },
      })
      
      if (existingFile) {
        logger.info('File already exists, returning existing record')
        return existingFile
      }
      
      // Upload to MinIO
      await fileOperations.uploadFromStream(
        objectName,
        Buffer.from(fileData.buffer),
        fileData.size,
        {
          'Content-Type': fileData.mimetype,
          'X-User-Id': userId,
        }
      )
      
      // Generate public URL
      const url = await fileOperations.getFileUrl(objectName, 7 * 24 * 60 * 60) // 7 days
      
      // Save to database
      const file = await prisma.fileUpload.create({
        data: {
          filename: fileData.filename,
          originalName: fileData.filename,
          mimetype: fileData.mimetype,
          size: fileData.size,
          url,
          objectName,
          userId,
          description,
          categoryId,
          metadata: {
            hash: fileHash,
            uploadedAt: new Date().toISOString(),
          },
        },
        include: {
          category: true,
          tags: true,
        },
      })
      
      // Add tags if provided
      if (tags && tags.length > 0) {
        await this.addTagsToFile(file.id, tags)
      }
      
      // Create activity log
      await prisma.learningActivity.create({
        data: {
          userId,
          type: 'MATERIAL_UPLOADED',
          title: '上传学习资料',
          description: `上传了文件：${fileData.filename}`,
          metadata: {
            fileId: file.id,
            filename: fileData.filename,
            size: fileData.size,
          },
        },
      })
      
      return file
    } catch (error) {
      // If upload failed, try to clean up
      try {
        await fileOperations.deleteFile(objectName)
      } catch (cleanupError) {
        logger.error('Failed to clean up file after error:', cleanupError)
      }
      throw error
    }
  },

  async getFiles(params: GetFilesParams) {
    const {
      userId,
      page,
      limit,
      category,
      tag,
      search,
      sortBy,
      sortOrder,
    } = params
    
    const skip = (page - 1) * limit
    
    // Build where clause
    const where: any = { userId }
    
    if (category) {
      where.categoryId = category
    }
    
    if (tag) {
      where.tags = {
        some: {
          name: tag,
        },
      }
    }
    
    if (search) {
      where.OR = [
        { filename: { contains: search, mode: 'insensitive' } },
        { originalName: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }
    
    const [files, total] = await Promise.all([
      prisma.fileUpload.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          category: true,
          tags: true,
        },
      }),
      prisma.fileUpload.count({ where }),
    ])
    
    // Update URLs if needed
    const filesWithUrls = await Promise.all(
      files.map(async (file) => {
        // Check if URL is expired and regenerate
        const url = await fileOperations.getFileUrl(file.objectName, 7 * 24 * 60 * 60)
        return { ...file, url }
      })
    )
    
    return {
      files: filesWithUrls,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  },

  async getFileById(fileId: string, userId: string) {
    const file = await prisma.fileUpload.findFirst({
      where: {
        id: fileId,
        OR: [
          { userId },
          { isPublic: true },
        ],
      },
      include: {
        category: true,
        tags: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })
    
    if (!file) {
      return null
    }
    
    // Update last accessed time
    await prisma.fileUpload.update({
      where: { id: fileId },
      data: { lastAccessedAt: new Date() },
    })
    
    // Generate fresh URL
    const url = await fileOperations.getFileUrl(file.objectName, 7 * 24 * 60 * 60)
    
    return { ...file, url }
  },

  async deleteFile(fileId: string, userId: string) {
    // Check ownership
    const file = await prisma.fileUpload.findFirst({
      where: {
        id: fileId,
        userId,
      },
    })
    
    if (!file) {
      throw new Error('文件不存在或无权删除')
    }
    
    // Delete from MinIO
    await fileOperations.deleteFile(file.objectName)
    
    // Delete from database
    await prisma.fileUpload.delete({
      where: { id: fileId },
    })
    
    logger.info(`File deleted: ${fileId} by user ${userId}`)
  },

  async downloadFile(fileId: string, userId: string) {
    const file = await this.getFileById(fileId, userId)
    
    if (!file) {
      throw new Error('文件不存在或无权访问')
    }
    
    // Increment download count
    await prisma.fileUpload.update({
      where: { id: fileId },
      data: { downloadCount: { increment: 1 } },
    })
    
    // Get file stream
    const stream = await fileOperations.getFileStream(file.objectName)
    
    return {
      stream,
      filename: file.originalName,
      mimetype: file.mimetype,
    }
  },

  async batchDelete(fileIds: string[], userId: string) {
    let deleted = 0
    let failed = 0
    
    for (const fileId of fileIds) {
      try {
        await this.deleteFile(fileId, userId)
        deleted++
      } catch (error) {
        logger.error(`Failed to delete file ${fileId}:`, error)
        failed++
      }
    }
    
    return { deleted, failed }
  },

  async addTagsToFile(fileId: string, tagNames: string[]) {
    const tags = await Promise.all(
      tagNames.map(async (name) => {
        return await prisma.fileTag.upsert({
          where: { name },
          update: {},
          create: { name },
        })
      })
    )
    
    await prisma.fileUpload.update({
      where: { id: fileId },
      data: {
        tags: {
          connect: tags.map((tag) => ({ id: tag.id })),
        },
      },
    })
  },
}
