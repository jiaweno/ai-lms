import { Job } from 'bull'
import { aiAnalysisService } from '@/services/aiAnalysisService'
import { logger } from '@/utils/logger'
import { prisma } from '@/config/database'

export const processAIAnalysisJob = async (job: Job) => {
  const { fileId, userId } = job.data
  
  try {
    logger.info(`Starting AI analysis for file ${fileId}`)
    
    // Update status
    await job.progress(10)
    
    // Perform analysis
    const result = await aiAnalysisService.analyzeDocument(fileId, userId)
    
    await job.progress(90)
    
    // Send notification
    // Ensure prisma.notification model and notificationService are defined as per DAY7 if this is to work
    // For now, this will likely cause an error if Notification model isn't fully integrated yet.
    // Assuming Notification model exists from a prior step or will be added.
    await prisma.notification.create({
      data: {
        userId,
        type: 'AI_ANALYSIS_COMPLETE',
        title: 'AI分析完成',
        message: '您的文档已分析完成，可以查看生成的学习路径了',
        metadata: {
          fileId,
          analysisId: result.analysisId, // analysisId is returned by analyzeDocument
        },
      },
    })
    
    await job.progress(100)
    
    return result
  } catch (error) {
    logger.error(`AI analysis job failed for file ${fileId}:`, error)
    await prisma.aIAnalysis.updateMany({ // Ensure AIAnalysis model is defined
        where: { fileId: fileId, userId: userId, status: 'PENDING' }, // Or however you track this specific job
        data: { status: 'FAILED', error: (error as Error).message }
    });
    throw error
  }
}
