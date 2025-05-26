import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { cn } from '@/utils/cn'
import { CloudArrowUpIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useFileUpload } from '@/hooks/useFileUpload'
import { UploadProgress } from './UploadProgress'
import { Button } from '@/components/ui/Button'
import toast from 'react-hot-toast'

interface FileUploaderProps {
  onUploadComplete?: (files: any[]) => void
  maxFiles?: number
  maxSize?: number // in bytes
  acceptedFileTypes?: string[]
  className?: string
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  onUploadComplete,
  maxFiles = 10,
  maxSize = 52428800, // 50MB
  acceptedFileTypes = ['pdf', 'doc', 'docx', 'txt', 'jpg', 'jpeg', 'png', 'gif'],
  className,
}) => {
  const [files, setFiles] = useState<File[]>([])
  const { uploadFiles, uploading, uploadProgress, cancelUpload } = useFileUpload()

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    if (rejectedFiles.length > 0) {
      const errors = rejectedFiles.map(({ file, errors }) => {
        const errorMessages = errors.map((e: any) => {
          if (e.code === 'file-too-large') return `${file.name} 文件过大`
          if (e.code === 'file-invalid-type') return `${file.name} 文件类型不支持`
          return e.message
        }).join(', ')
        return errorMessages
      })
      toast.error(errors.join('\n'))
      return
    }

    setFiles(prev => [...prev, ...acceptedFiles])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles,
    maxSize,
    accept: acceptedFileTypes.reduce((acc, type) => {
      // Map file extensions to MIME types
      const mimeMap: Record<string, string[]> = {
        pdf: ['application/pdf'],
        doc: ['application/msword'],
        docx: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        txt: ['text/plain'],
        jpg: ['image/jpeg'],
        jpeg: ['image/jpeg'],
        png: ['image/png'],
        gif: ['image/gif'],
      }
      
      if (mimeMap[type]) {
        mimeMap[type].forEach(mime => {
          acc[mime] = [`.${type}`]
        })
      }
      
      return acc
    }, {} as Record<string, string[]>),
  })

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error('请先选择要上传的文件')
      return
    }

    try {
      const uploadedFiles = await uploadFiles(files)
      toast.success(`成功上传 ${uploadedFiles.length} 个文件`)
      setFiles([])
      onUploadComplete?.(uploadedFiles)
    } catch (error: any) {
      toast.error(error.message || '上传失败')
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div
        {...getRootProps()}
        className={cn(
          'relative border-2 border-dashed rounded-lg p-6 hover:border-gray-400 transition-colors cursor-pointer',
          isDragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300',
          uploading && 'pointer-events-none opacity-60'
        )}
      >
        <input {...getInputProps()} />
        <div className="text-center">
          <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-600">
            {isDragActive ? (
              '松开鼠标上传文件'
            ) : (
              <>
                <span className="font-semibold">点击上传</span> 或拖拽文件到此处
              </>
            )}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            支持 {acceptedFileTypes.join(', ')} 格式，单个文件最大 {formatFileSize(maxSize)}
          </p>
        </div>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-900">待上传文件 ({files.length})</h4>
          <ul className="divide-y divide-gray-200 border border-gray-200 rounded-lg">
            {files.map((file, index) => (
              <li key={index} className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <FileIcon type={file.type} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{file.name}</p>
                    <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                {!uploading && (
                  <button
                    onClick={() => removeFile(index)}
                    className="ml-4 flex-shrink-0 text-gray-400 hover:text-gray-500"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {uploading && uploadProgress && (
        <UploadProgress
          progress={uploadProgress}
          onCancel={cancelUpload}
        />
      )}

      {files.length > 0 && !uploading && (
        <div className="flex justify-end space-x-3">
          <Button
            variant="outline"
            onClick={() => setFiles([])}
          >
            清空列表
          </Button>
          <Button
            onClick={handleUpload}
          >
            开始上传 ({files.length})
          </Button>
        </div>
      )}
    </div>
  )
}

// File type icon component
const FileIcon: React.FC<{ type: string }> = ({ type }) => {
  const getIconClass = () => {
    if (type.includes('pdf')) return 'bg-red-100 text-red-600'
    if (type.includes('word') || type.includes('document')) return 'bg-blue-100 text-blue-600'
    if (type.includes('image')) return 'bg-green-100 text-green-600'
    return 'bg-gray-100 text-gray-600'
  }

  const getIconText = () => {
    if (type.includes('pdf')) return 'PDF'
    if (type.includes('word') || type.includes('document')) return 'DOC'
    if (type.includes('image')) return 'IMG'
    return 'FILE'
  }

  return (
    <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold', getIconClass())}>
      {getIconText()}
    </div>
  )
}
