import React from 'react'
import { cn } from '@/utils/cn'
import { XMarkIcon } from '@heroicons/react/24/outline'

interface UploadProgressProps {
  progress: {
    [filename: string]: {
      progress: number
      status: 'uploading' | 'completed' | 'failed'
      error?: string
    }
  }
  onCancel?: () => void
  className?: string
}

export const UploadProgress: React.FC<UploadProgressProps> = ({
  progress,
  onCancel,
  className,
}) => {
  const totalFiles = Object.keys(progress).length
  const completedFiles = Object.values(progress).filter(p => p.status === 'completed').length
  const overallProgress = totalFiles > 0 
    ? Math.round((completedFiles / totalFiles) * 100)
    : 0

  return (
    <div className={cn('bg-white rounded-lg border border-gray-200 p-4', className)}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-gray-900">
          上传进度 ({completedFiles}/{totalFiles})
        </h4>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-500"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="space-y-3">
        {Object.entries(progress).map(([filename, fileProgress]) => (
          <div key={filename}>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-700 truncate flex-1 mr-2">{filename}</span>
              <span className="text-gray-500 flex-shrink-0">
                {fileProgress.status === 'completed' ? '完成' : 
                 fileProgress.status === 'failed' ? '失败' : 
                 `${fileProgress.progress}%`}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={cn(
                  'h-2 rounded-full transition-all duration-300',
                  fileProgress.status === 'completed' ? 'bg-green-500' :
                  fileProgress.status === 'failed' ? 'bg-red-500' :
                  'bg-primary-500'
                )}
                style={{ width: `${fileProgress.progress}%` }}
              />
            </div>
            {fileProgress.error && (
              <p className="text-xs text-red-600 mt-1">{fileProgress.error}</p>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="font-medium text-gray-900">总进度</span>
          <span className="text-gray-600">{overallProgress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-primary-600 h-3 rounded-full transition-all duration-300"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
      </div>
    </div>
  )
}
