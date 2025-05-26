import { Job } from 'bull'
import { documentService } from '@/services/documentService'
import { logger } from '@/utils/logger'

export const processDocumentJob = async (job: Job) => {
  const { fileId, operation } = job.data
  
  try {
    logger.info(`Processing document ${fileId}, operation: ${operation}`)
    
    switch (operation) {
      case 'parse':
        return await documentService.parseDocument(fileId)
      
      case 'extract-text':
        const parsed = await documentService.parseDocument(fileId)
        return parsed.content
      
      case 'extract-sections':
        const doc = await documentService.parseDocument(fileId)
        return doc.sections
      
      default:
        throw new Error(`Unknown operation: ${operation}`)
    }
  } catch (error) {
    logger.error(`Document processing job failed for file ${fileId}:`, error)
    throw error
  }
}
