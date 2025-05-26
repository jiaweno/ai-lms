import { apiService } from '@/utils/api'

interface CreatePathParams {
  title: string
  description?: string
  fileId?: string
  analysisId?: string
  nodes: any[]
}

interface UpdateProgressParams {
  nodeId: string
  completed: boolean
  timeSpent?: number
}

export const learningPathService = {
  async createPath(params: CreatePathParams) {
    const response = await apiService.post('/learning-paths', params)
    return response.data
  },

  async getPaths(includeShared = true) {
    const response = await apiService.get('/learning-paths', {
      params: { includeShared }
    })
    return response.data.data
  },

  async getPathDetails(pathId: string) {
    const response = await apiService.get(`/learning-paths/${pathId}`)
    return response.data.data
  },

  async enrollInPath(pathId: string) {
    const response = await apiService.post(`/learning-paths/${pathId}/enroll`)
    return response.data
  },

  async updateProgress(pathId: string, params: UpdateProgressParams) {
    const response = await apiService.put(`/learning-paths/${pathId}/progress`, params)
    return response.data
  }
}
