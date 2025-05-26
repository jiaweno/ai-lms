import { apiService } from '@/utils/api'

interface CreateQuestionData {
  title: string
  content: any // Rich text content, can be structured JSON or HTML string
  type: string // e.g., 'SINGLE_CHOICE', 'MULTIPLE_CHOICE', etc.
  difficulty?: string
  points?: number
  timeLimit?: number
  explanation?: string
  tags?: string[]
  options?: Array<{
    content: string
    isCorrect: boolean
    explanation?: string
  }>
}

interface GetQuestionsParams {
  page?: number
  limit?: number
  type?: string
  difficulty?: string
  tag?: string
  search?: string
}

export const questionService = {
  async createQuestion(data: CreateQuestionData) {
    const response = await apiService.post('/questions', data)
    return response.data // Assuming backend returns { success: true, data: question }
  },

  async getQuestions(params: GetQuestionsParams = {}) {
    const response = await apiService.get('/questions', { params })
    return response.data.data // Assuming backend wraps list in { data: { questions: [], pagination: {} } }
  },

  async getQuestion(id: string) {
    const response = await apiService.get(`/questions/${id}`)
    return response.data.data
  },

  async updateQuestion(id: string, data: Partial<CreateQuestionData>) {
    const response = await apiService.put(`/questions/${id}`, data)
    return response.data.data
  },

  async deleteQuestion(id: string) {
    const response = await apiService.delete(`/questions/${id}`)
    return response.data // Assuming backend returns { success: true, message: "..." }
  },

  async batchImportQuestions(questions: CreateQuestionData[]) {
    const response = await apiService.post('/questions/batch-import', { questions })
    return response.data // Assuming backend returns { success: true, data: { successCount, failedCount, errors } }
  },

  async getQuestionStats() {
    const response = await apiService.get('/questions/stats/overview')
    return response.data.data // Assuming backend wraps stats in { data: { ...stats } }
  },
}
