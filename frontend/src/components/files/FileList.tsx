import React from 'react'
import { cn } from '@/utils/cn'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import {
  DocumentIcon,
  PhotoIcon,
  FilmIcon,
  MusicalNoteIcon,
  FolderIcon,
  EllipsisVerticalIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  TrashIcon,
  PencilIcon,
} from '@heroicons/react/24/outline'
import { Dropdown } from '@/components/ui/Dropdown' // Assuming you have a Dropdown component
import { formatFileSize } from '@/utils/fileHelpers' // Assuming you have this helper

interface FileItem {
  id: string
  filename: string
  originalName: string
  mimetype: string
  size: number
  url: string
  category?: {
    id: string
    name: string
    color?: string
  }
  tags?: Array<{
    id: string
    name: string
  }>
  downloadCount: number
  createdAt: string
}

interface FileListProps {
  files: FileItem[]
  viewMode: 'grid' | 'list'
  selectedFiles: string[]
  onSelectFile: (fileId: string) => void
  onSelectAll: () => void
  onPreview: (file: FileItem) => void
  onDownload: (file: FileItem) => void
  onDelete: (file: FileItem) => void
  onRename?: (file: FileItem) => void
  className?: string
}

export const FileList: React.FC<FileListProps> = ({
  files,
  viewMode,
  selectedFiles,
  onSelectFile,
  onSelectAll,
  onPreview,
  onDownload,
  onDelete,
  onRename,
  className,
}) => {
  const getFileIcon = (mimetype: string) => {
    if (mimetype.includes('image')) return PhotoIcon
    if (mimetype.includes('video')) return FilmIcon
    if (mimetype.includes('audio')) return MusicalNoteIcon
    if (mimetype.includes('pdf')) return DocumentIcon
    return FolderIcon
  }

  if (viewMode === 'grid') {
    return (
      <div className={cn('grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4', className)}>
        {files.map((file) => {
          const Icon = getFileIcon(file.mimetype)
          const isSelected = selectedFiles.includes(file.id)
          
          return (
            <div
              key={file.id}
              className={cn(
                'relative group rounded-lg border p-4 hover:shadow-md transition-all cursor-pointer',
                isSelected ? 'border-primary-500 bg-primary-50' : 'border-gray-200 bg-white'
              )}
              onClick={() => onPreview(file)}
            >
              <div className="absolute top-2 left-2">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={(e) => {
                    e.stopPropagation()
                    onSelectFile(file.id)
                  }}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
              </div>
              
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Dropdown
                  trigger={
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <EllipsisVerticalIcon className="h-5 w-5 text-gray-500" />
                    </button>
                  }
                  items={[
                    {
                      label: '预览',
                      icon: EyeIcon,
                      onClick: () => onPreview(file),
                    },
                    {
                      label: '下载',
                      icon: ArrowDownTrayIcon,
                      onClick: () => onDownload(file),
                    },
                    ...(onRename ? [{
                      label: '重命名',
                      icon: PencilIcon,
                      onClick: () => onRename(file),
                    }] : []),
                    {
                      label: '删除',
                      icon: TrashIcon,
                      onClick: () => onDelete(file),
                      className: 'text-red-600',
                    },
                  ]}
                />
              </div>
              
              <div className="flex flex-col items-center">
                <Icon className="h-12 w-12 text-gray-400 mb-3" />
                <h4 className="text-sm font-medium text-gray-900 text-center truncate w-full">
                  {file.originalName}
                </h4>
                <p className="text-xs text-gray-500 mt-1">{formatFileSize(file.size)}</p>
                {file.category && (
                  <span
                    className={cn(
                      'mt-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                      file.category.color || 'bg-gray-100 text-gray-800'
                    )}
                  >
                    {file.category.name}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // List view
  return (
    <div className={cn('bg-white rounded-lg border border-gray-200', className)}>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left">
              <input
                type="checkbox"
                checked={selectedFiles.length === files.length && files.length > 0}
                onChange={onSelectAll}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              文件名
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              大小
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              分类
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              上传时间
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              下载次数
            </th>
            <th scope="col" className="relative px-6 py-3">
              <span className="sr-only">操作</span>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {files.map((file) => {
            const Icon = getFileIcon(file.mimetype)
            const isSelected = selectedFiles.includes(file.id)
            
            return (
              <tr key={file.id} className={cn('hover:bg-gray-50', isSelected && 'bg-primary-50')}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onSelectFile(file.id)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Icon className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {file.originalName}
                      </div>
                      {file.tags && file.tags.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {file.tags.map(tag => (
                            <span key={tag.id} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                              {tag.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatFileSize(file.size)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {file.category ? (
                    <span
                      className={cn(
                        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                        file.category.color || 'bg-gray-100 text-gray-800'
                      )}
                    >
                      {file.category.name}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-500">-</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDistanceToNow(new Date(file.createdAt), {
                    addSuffix: true,
                    locale: zhCN,
                  })}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {file.downloadCount}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Dropdown
                    trigger={
                      <button className="text-gray-400 hover:text-gray-500">
                        <EllipsisVerticalIcon className="h-5 w-5" />
                      </button>
                    }
                    items={[
                      {
                        label: '预览',
                        icon: EyeIcon,
                        onClick: () => onPreview(file),
                      },
                      {
                        label: '下载',
                        icon: ArrowDownTrayIcon,
                        onClick: () => onDownload(file),
                      },
                      ...(onRename ? [{
                        label: '重命名',
                        icon: PencilIcon,
                        onClick: () => onRename(file),
                      }] : []),
                      {
                        label: '删除',
                        icon: TrashIcon,
                        onClick: () => onDelete(file),
                        className: 'text-red-600',
                      },
                    ]}
                  />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
