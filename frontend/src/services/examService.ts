import { apiService } from '@/utils/api'

interface CreateExamData {
  title: string
  description?: string
  type: string
  timeLimit?: number
  passingScore?: number
  maxAttempts?: number
  startTime?: string
  endTime?: string
  settings?: any
  questionIds: string[]
}

interface GetExamsParams {
  page?: number
  limit?: number
  type?: string
  status?: string
  search?: string
}

interface SubmitAnswerData {
  questionId: string
  content: any
  timeSpent?: number
}

export const examService = {
  async createExam(data: CreateExamData) {
    const response = await apiService.post('/exams', data)
    return response.data
  },

  async getExams(params: GetExamsParams = {}) {
    const response = await apiService.get('/exams', { params })
    return response.data.data // Assuming backend wraps in { success: true, data: ... }
  },

  async getExamDetails(examId: string) {
    const response = await apiService.get(`/exams/${examId}`)
    return response.data.data
  },

  async startExam(examId: string) {
    const response = await apiService.post(`/exams/${examId}/start`)
    return response.data.data 
  },

  async getExamRecord(examId: string, recordId?: string) { 
    const url = recordId 
      ? `/exams/${examId}/records/${recordId}` // If a specific record is needed
      : `/exams/${examId}/record`; // For the latest/active record for the user for that exam
    try {
      const response = await apiService.get(url)
      return response.data.data
    } catch (error: any) {
      if (error.response && error.response.status === 404) {
        return null; 
      }
      throw error; 
    }
  },

  async submitAnswer(examRecordId: string, questionId: string, answerData: SubmitAnswerData) {
    const response = await apiService.post(`/exams/records/${examRecordId}/answers`, { ...answerData, questionId })
    return response.data.data
  },
  
  async batchSubmitAnswers(examRecordId: string, answers: SubmitAnswerData[]) {
    const response = await apiService.post(`/exams/records/${examRecordId}/batch-answers`, { answers })
    return response.data.data
  },

  async finishExam(examRecordId: string) {
    const response = await apiService.post(`/exams/records/${examRecordId}/finish`)
    return response.data.data
  },

  async getExamResult(examRecordId: string) { 
    const response = await apiService.get(`/exams/records/${examRecordId}/result`)
    return response.data.data
  },

  async getExamStats(examId: string) {
    const response = await apiService.get(`/exams/${examId}/stats`)
    return response.data.data
  },

  async publishExam(examId: string) {
    const response = await apiService.post(`/exams/${examId}/publish`)
    return response.data.data
  },
}
