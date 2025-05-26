import { Client } from 'minio'
import { env } from './env'
import { logger } from '@/utils/logger'

export const minioClient = new Client({
  endPoint: env.MINIO_ENDPOINT,
  port: env.MINIO_PORT,
  useSSL: env.MINIO_USE_SSL,
  accessKey: env.MINIO_ACCESS_KEY,
  secretKey: env.MINIO_SECRET_KEY,
})

// Initialize bucket
export const initializeMinio = async () => {
  try {
    const bucketExists = await minioClient.bucketExists(env.MINIO_BUCKET_NAME)
    
    if (!bucketExists) {
      await minioClient.makeBucket(env.MINIO_BUCKET_NAME, 'us-east-1')
      logger.info(`Created MinIO bucket: ${env.MINIO_BUCKET_NAME}`)
      
      // Set bucket policy for public read access to certain file types
      const policy = {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { AWS: ['*'] },
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${env.MINIO_BUCKET_NAME}/public/*`],
          },
        ],
      }
      
      await minioClient.setBucketPolicy(env.MINIO_BUCKET_NAME, JSON.stringify(policy))
    }
    
    logger.info('MinIO initialized successfully')
  } catch (error) {
    logger.error('Failed to initialize MinIO:', error)
    throw error
  }
}

// File operations
export const fileOperations = {
  async uploadFile(
    objectName: string,
    filePath: string,
    metadata: Record<string, string> = {}
  ) {
    try {
      const result = await minioClient.fPutObject(
        env.MINIO_BUCKET_NAME,
        objectName,
        filePath,
        metadata
      )
      return result
    } catch (error) {
      logger.error('Failed to upload file to MinIO:', error)
      throw error
    }
  },

  async uploadFromStream(
    objectName: string,
    stream: NodeJS.ReadableStream,
    size: number,
    metadata: Record<string, string> = {}
  ) {
    try {
      const result = await minioClient.putObject(
        env.MINIO_BUCKET_NAME,
        objectName,
        stream,
        size,
        metadata
      )
      return result
    } catch (error) {
      logger.error('Failed to upload stream to MinIO:', error)
      throw error
    }
  },

  async deleteFile(objectName: string) {
    try {
      await minioClient.removeObject(env.MINIO_BUCKET_NAME, objectName)
    } catch (error) {
      logger.error('Failed to delete file from MinIO:', error)
      throw error
    }
  },

  async getFileUrl(objectName: string, expiry: number = 3600) {
    try {
      const url = await minioClient.presignedGetObject(
        env.MINIO_BUCKET_NAME,
        objectName,
        expiry
      )
      return url
    } catch (error) {
      logger.error('Failed to generate presigned URL:', error)
      throw error
    }
  },

  async getFileStream(objectName: string) {
    try {
      const stream = await minioClient.getObject(env.MINIO_BUCKET_NAME, objectName)
      return stream
    } catch (error) {
      logger.error('Failed to get file stream:', error)
      throw error
    }
  },

  async getFileInfo(objectName: string) {
    try {
      const stat = await minioClient.statObject(env.MINIO_BUCKET_NAME, objectName)
      return stat
    } catch (error) {
      logger.error('Failed to get file info:', error)
      throw error
    }
  },
}
