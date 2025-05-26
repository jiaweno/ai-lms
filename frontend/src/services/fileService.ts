import { apiService } from '@/utils/api' // Assuming you have this
import { APP_CONFIG } from '@/utils/constants'

interface FileUploadResponse {
  id: string
  filename: string
  originalName: string
  mimetype: string
  size: number
  url: string
  createdAt: string
  // Add other fields if your backend returns more
}

interface GetFilesParams {
  page?: number
  limit?: number
  category?: string
  tag?: string
  search?: string
  sortBy?: 'name' | 'size' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
}

interface GetFilesResponse {
  files: FileUploadResponse[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export const fileService = {
  async uploadFile(file: File, onUploadProgress?: (progress: number) => void): Promise<FileUploadResponse> {
    const formData = new FormData()
    formData.append('file', file)
    // Add other fields if needed, e.g., description, categoryId
    // formData.append('description', 'My file description');

    const response = await apiService.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onUploadProgress?.(percentCompleted)
        }
      },
    })
    return response.data.file
  },

  async getFiles(params: GetFilesParams = {}): Promise<GetFilesResponse> {
    const response = await apiService.get('/files', { params })
    return response.data.data 
  },

  async getFile(fileId: string): Promise<FileUploadResponse> {
    const response = await apiService.get(`/files/${fileId}`)
    return response.data.data
  },

  async deleteFile(fileId: string): Promise<void> {
    await apiService.delete(`/files/${fileId}`)
  },
  
  async batchDeleteFiles(fileIds: string[]): Promise<{ deleted: number; failed: number }> {
    const response = await apiService.post('/files/batch-delete', { fileIds })
    return response.data
  },

  async downloadFile(fileId: string, filename: string): Promise<void> {
    const response = await apiService.get(`/files/${fileId}/download`, {
      responseType: 'blob', // Important for file downloads
    })
    
    // Create a link and trigger download
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', filename) // Or use a filename from response headers
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  },

  // Example: Get categories and tags for filtering (if backend supports it)
  async getFileCategories() {
    // const response = await apiService.get('/files/categories');
    // return response.data.data;
    return Promise.resolve([ // Mock data
      { id: 'cat1', name: '文档' },
      { id: 'cat2', name: '图片' },
    ]);
  },

  async getFileTags() {
    // const response = await apiService.get('/files/tags');
    // return response.data.data;
    return Promise.resolve([ // Mock data
      { id: 'tag1', name: '重要' },
      { id: 'tag2', name: '学习资料' },
    ]);
  },
}
