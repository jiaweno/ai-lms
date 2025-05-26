import { apiService } from '@/utils/api'

export const dashboardService = {
  async getStats(range: 'today' | 'week' | 'month' | 'all' = 'week') {
    const response = await apiService.get('/dashboard/stats', {
      params: { range },
    })
    return response.data.data
  },

  async getProgress() {
    const response = await apiService.get('/dashboard/progress')
    return response.data.data
  },

  async getActivities(page = 1, limit = 20) {
    const response = await apiService.get('/dashboard/activities', {
      params: { page, limit },
    })
    return response.data.data
  },

  async getLearningTrend(range: 'week' | 'month' | 'year' = 'week') {
    const response = await apiService.get('/dashboard/learning-trend', {
      params: { range },
    })
    return response.data.data
  },
}
