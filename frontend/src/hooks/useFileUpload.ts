import { useState, useCallback } from 'react'
import { apiService } from '@/utils/api' // Assuming you have this
import toast from 'react-hot-toast'

interface UploadProgressState {
  [filename: string]: {
    progress: number
    status: 'uploading' | 'completed' | 'failed'
    error?: string
    fileId?: string // Store the ID of the uploaded file from backend
  }
}

export const useFileUpload = () => {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<UploadProgressState>({})
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]) // Store backend response for uploaded files

  const updateFileProgress = useCallback((filename: string, progress: number, status: 'uploading' | 'completed' | 'failed', error?: string, fileId?: string) => {
    setUploadProgress(prev => ({
      ...prev,
      [filename]: {
        ...prev[filename],
        progress,
        status,
        error,
        fileId,
      },
    }))
  }, [])

  const uploadFiles = useCallback(async (files: File[]) => {
    if (files.length === 0) return []

    setUploading(true)
    setUploadedFiles([])
    const initialProgress: UploadProgressState = {}
    files.forEach(file => {
      initialProgress[file.name] = { progress: 0, status: 'uploading' }
    })
    setUploadProgress(initialProgress)

    const uploadPromises = files.map(file => {
      const formData = new FormData()
      formData.append('file', file)
      // You can append other data like 'description', 'categoryId' here if needed
      // formData.append('description', 'My file description');

      return apiService.post('/files/upload', formData, {
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1))
          updateFileProgress(file.name, percentCompleted, 'uploading')
        },
      })
      .then(response => {
        updateFileProgress(file.name, 100, 'completed', undefined, response.data.file.id)
        return response.data.file // Return the file data from backend
      })
      .catch(error => {
        const errorMessage = error.response?.data?.message || error.message || 'Upload failed'
        updateFileProgress(file.name, 0, 'failed', errorMessage)
        toast.error(`Error uploading ${file.name}: ${errorMessage}`)
        throw error // Re-throw to allow Promise.allSettled to catch it
      })
    })

    const results = await Promise.allSettled(uploadPromises)
    
    const successfulUploads = results
      .filter(result => result.status === 'fulfilled')
      .map((result: any) => result.value) // Type assertion, as fulfilled promises have 'value'

    setUploadedFiles(successfulUploads)
    setUploading(false)

    if (successfulUploads.length < files.length) {
        // Some files failed to upload
        // Error toasts are already shown per file
    }
    
    return successfulUploads
  }, [updateFileProgress])

  const cancelUpload = useCallback(() => {
    // In a real scenario, you would need an AbortController for each request
    // and call controller.abort(). This is a simplified version.
    setUploading(false)
    setUploadProgress(prev => {
      const newProgress = { ...prev }
      Object.keys(newProgress).forEach(filename => {
        if (newProgress[filename].status === 'uploading') {
          newProgress[filename].status = 'failed'
          newProgress[filename].error = 'Upload cancelled'
        }
      })
      return newProgress
    })
    toast.info('Uploads cancelled')
  }, [])

  return {
    uploadFiles,
    uploading,
    uploadProgress,
    uploadedFiles, // Return this to get info about successfully uploaded files
    cancelUpload,
  }
}
