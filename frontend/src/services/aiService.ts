import { apiService } from '@/utils/api'

interface AnalyzeDocumentParams {
  fileId: string
  options?: {
    generatePaths?: boolean
    extractKeywords?: boolean
    analyzeDepth?: 'basic' | 'detailed' | 'comprehensive'
  }
}

interface GeneratePathParams {
  title: string
  description?: string
  knowledgePoints: any[]
  targetAudience?: string
}

export const aiService = {
  async analyzeDocument(params: AnalyzeDocumentParams) {
    const response = await apiService.post('/ai/analyze-document', params)
    return response.data
  },

  async getAnalysisStatus(jobId: string) {
    const response = await apiService.get(`/ai/analysis-status/${jobId}`)
    return response.data
  },

  async generatePath(params: GeneratePathParams) {
    const response = await apiService.post('/ai/generate-path', params)
    return response.data
  },

  async getAnalyses(page = 1, limit = 20) {
    const response = await apiService.get('/ai/analyses', {
      params: { page, limit }
    })
    return response.data.data
  },

  // Poll for job completion
  async waitForAnalysis(jobId: string, onProgress?: (progress: number) => void): Promise<any> {
    const maxAttempts = 60 // 5 minutes max
    let attempts = 0
    
    while (attempts < maxAttempts) {
      const status = await this.getAnalysisStatus(jobId)
      
      if (onProgress && status.progress) {
        onProgress(status.progress)
      }
      
      if (status.status === 'completed') {
        return status.result
      }
      
      if (status.status === 'failed') {
        throw new Error(status.error || 'Analysis failed')
      }
      
      // Wait 5 seconds before next poll
      await new Promise(resolve => setTimeout(resolve, 5000))
      attempts++
    }
    
    throw new Error('Analysis timeout')
  }
}
