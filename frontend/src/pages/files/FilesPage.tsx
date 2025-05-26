import React, { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { useFiles } from '@/hooks/useFiles'
import { FileUploader } from '@/components/files/FileUploader'
import { FileList } from '@/components/files/FileList'
import { FileFilters } from '@/components/files/FileFilters'
import { FilePreview } from '@/components/files/FilePreview'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Alert } from '@/components/ui/Alert'
import {
  CloudArrowUpIcon,
  Squares2X2Icon,
  ListBulletIcon,
  ArrowDownTrayIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

export default function FilesPage() {
  const {
    files,
    isLoading,
    error,
    filters,
    setFilters,
    viewMode,
    setViewMode,
    selectedFiles,
    selectFile,
    selectAllFiles,
    clearSelection,
    uploadFiles,
    deleteFile,
    deleteMultipleFiles,
    downloadFile,
    refetch,
  } = useFiles()

  const [showUploader, setShowUploader] = useState(false)
  const [previewFile, setPreviewFile] = useState<any>(null)

  useEffect(() => {
    refetch()
  }, [])

  const handleUploadComplete = (uploadedFiles: any[]) => {
    setShowUploader(false)
    refetch()
  }

  const handleDelete = async (file: any) => {
    if (window.confirm(`确定要删除文件 "${file.originalName}" 吗？`)) {
      try {
        await deleteFile(file.id)
        toast.success('文件删除成功')
      } catch (error: any) {
        toast.error(error.message || '删除失败')
      }
    }
  }

  const handleBatchDelete = async () => {
    if (selectedFiles.length === 0) {
      toast.error('请先选择要删除的文件')
      return
    }

    if (window.confirm(`确定要删除选中的 ${selectedFiles.length} 个文件吗？`)) {
      try {
        await deleteMultipleFiles(selectedFiles)
        toast.success('批量删除成功')
        clearSelection()
      } catch (error: any) {
        toast.error(error.message || '批量删除失败')
      }
    }
  }

  const handleBatchDownload = async () => {
    if (selectedFiles.length === 0) {
      toast.error('请先选择要下载的文件')
      return
    }

    for (const fileId of selectedFiles) {
      const file = files.find(f => f.id === fileId)
      if (file) {
        await downloadFile(file)
      }
    }
  }

  if (isLoading && !files.length) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Helmet>
        <title>文件管理 - AI学习管理系统</title>
      </Helmet>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">文件管理</h1>
          <Button
            onClick={() => setShowUploader(!showUploader)}
            icon={CloudArrowUpIcon}
          >
            上传文件
          </Button>
        </div>
      </div>

      {/* Upload Area */}
      {showUploader && (
        <div className="mb-6">
          <FileUploader onUploadComplete={handleUploadComplete} />
        </div>
      )}

      {/* Filters and Actions Bar */}
      <div className="mb-6 space-y-4">
        <FileFilters
          filters={filters}
          onFiltersChange={setFilters}
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {selectedFiles.length > 0 && (
              <>
                <span className="text-sm text-gray-600">
                  已选择 {selectedFiles.length} 个文件
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={clearSelection}
                >
                  取消选择
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  icon={ArrowDownTrayIcon}
                  onClick={handleBatchDownload}
                >
                  批量下载
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  icon={TrashIcon}
                  onClick={handleBatchDelete}
                >
                  批量删除
                </Button>
              </>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'p-2 rounded',
                viewMode === 'grid' ? 'bg-gray-200 text-gray-900' : 'text-gray-500 hover:text-gray-700'
              )}
            >
              <Squares2X2Icon className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'p-2 rounded',
                viewMode === 'list' ? 'bg-gray-200 text-gray-900' : 'text-gray-500 hover:text-gray-700'
              )}
            >
              <ListBulletIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <Alert variant="error" showIcon className="mb-6">
          <div>
            <h3 className="font-semibold">加载失败</h3>
            <p className="text-sm">{error}</p>
            <button
              onClick={refetch}
              className="mt-2 text-sm font-medium text-red-600 hover:text-red-500"
            >
              重试
            </button>
          </div>
        </Alert>
      )}

      {/* File List */}
      {files.length === 0 ? (
        <div className="text-center py-12">
          <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">没有文件</h3>
          <p className="mt-1 text-sm text-gray-500">开始上传您的学习资料吧</p>
          <div className="mt-6">
            <Button
              onClick={() => setShowUploader(true)}
              icon={CloudArrowUpIcon}
            >
              上传文件
            </Button>
          </div>
        </div>
      ) : (
        <FileList
          files={files}
          viewMode={viewMode}
          selectedFiles={selectedFiles}
          onSelectFile={selectFile}
          onSelectAll={selectAllFiles}
          onPreview={setPreviewFile}
          onDownload={downloadFile}
          onDelete={handleDelete}
        />
      )}

      {/* File Preview Modal */}
      {previewFile && (
        <FilePreview
          file={previewFile}
          onClose={() => setPreviewFile(null)}
          onDownload={() => downloadFile(previewFile)}
        />
      )}
    </div>
  )
}
