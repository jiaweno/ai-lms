import { env } from '@/config/env'
import { customAlphabet } from 'nanoid'
import path from 'path'

const nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyz', 12)

export const generateUniqueFilename = (originalName: string): string => {
  const extension = path.extname(originalName)
  const baseName = path.basename(originalName, extension)
  const sanitizedBaseName = baseName.replace(/[^a-zA-Z0-9_-]/g, '_')
  return `${sanitizedBaseName}-${nanoid()}${extension}`
}

export const getFileExtension = (filename: string): string => {
  return path.extname(filename).toLowerCase().substring(1)
}

export const isFileTypeAllowed = (filename: string, mimetype: string): boolean => {
  const extension = getFileExtension(filename)
  const allowedExtensions = env.ALLOWED_FILE_TYPES.split(',')
  
  // Check both extension and mimetype if possible
  // This is a basic check; more robust validation might be needed
  if (allowedExtensions.includes(extension)) {
    return true
  }
  
  // Fallback to mimetype check if extension is not conclusive
  // Example: 'image/jpeg' for '.jpg'
  const mimeParts = mimetype.split('/')
  if (mimeParts.length === 2 && allowedExtensions.includes(mimeParts[1])) {
    return true
  }
  
  return false
}

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export const getFileCategory = (mimetype: string): string => {
  if (mimetype.startsWith('image/')) return 'Image'
  if (mimetype.startsWith('video/')) return 'Video'
  if (mimetype.startsWith('audio/')) return 'Audio'
  if (mimetype === 'application/pdf') return 'PDF Document'
  if (mimetype.includes('word') || mimetype.includes('document')) return 'Word Document'
  if (mimetype.includes('excel') || mimetype.includes('spreadsheet')) return 'Excel Spreadsheet'
  if (mimetype.includes('presentation') || mimetype.includes('powerpoint')) return 'Presentation'
  if (mimetype === 'text/plain') return 'Text File'
  if (mimetype === 'application/zip' || mimetype === 'application/x-rar-compressed') return 'Archive'
  return 'Other'
}

export const getPresignedUrl = async (objectName: string): Promise<string> => {
  // This would typically interact with your MinIO/S3 service to get a presigned URL
  // For now, returning a placeholder or direct link if public
  if (env.MINIO_USE_SSL) {
    return `https://${env.MINIO_ENDPOINT}:${env.MINIO_PORT}/${env.MINIO_BUCKET_NAME}/${objectName}`
  }
  return `http://${env.MINIO_ENDPOINT}:${env.MINIO_PORT}/${env.MINIO_BUCKET_NAME}/${objectName}`
}
