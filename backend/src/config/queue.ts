import Bull from 'bull'
import { env } from './env'
import { logger } from '@/utils/logger'

// Create queue instances
export const aiAnalysisQueue = new Bull('ai-analysis', env.QUEUE_REDIS_URL || env.REDIS_URL, {
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
})

export const documentProcessingQueue = new Bull('document-processing', env.QUEUE_REDIS_URL || env.REDIS_URL, {
  defaultJobOptions: {
    removeOnComplete: 50,
    removeOnFail: 25,
    attempts: 2,
  },
})

// Queue event handlers
aiAnalysisQueue.on('completed', (job, result) => {
  logger.info(`AI analysis job ${job.id} completed`)
})

aiAnalysisQueue.on('failed', (job, err) => {
  logger.error(`AI analysis job ${job.id} failed:`, err)
})

documentProcessingQueue.on('completed', (job, result) => {
  logger.info(`Document processing job ${job.id} completed`)
})

documentProcessingQueue.on('failed', (job, err) => {
  logger.error(`Document processing job ${job.id} failed:`, err)
})

// Process jobs
export const startQueueProcessors = async () => {
  const { processAIAnalysisJob } = await import('@/workers/aiAnalysisWorker')
  const { processDocumentJob } = await import('@/workers/documentWorker')
  
  aiAnalysisQueue.process(env.MAX_CONCURRENT_JOBS, processAIAnalysisJob)
  documentProcessingQueue.process(env.MAX_CONCURRENT_JOBS, processDocumentJob)
  
  logger.info('Queue processors started')
}
