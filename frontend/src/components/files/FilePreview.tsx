import React from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { XMarkIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/Button'
import { formatFileSize } from '@/utils/fileHelpers'

interface FilePreviewProps {
  file: {
    id: string
    originalName: string
    mimetype: string
    size: number
    url: string // This should be a direct or presigned URL to the file content
    description?: string
    createdAt: string
  }
  onClose: () => void
  onDownload: () => void
}

export const FilePreview: React.FC<FilePreviewProps> = ({
  file,
  onClose,
  onDownload,
}) => {
  const isImage = file.mimetype.startsWith('image/')
  const isPdf = file.mimetype === 'application/pdf'
  // Add more type checks as needed (e.g., video, audio)

  return (
    <Transition appear show={true} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900 truncate"
                  >
                    {file.originalName}
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                {/* Content */}
                <div className="mt-4 max-h-[70vh] overflow-y-auto">
                  {isImage ? (
                    <img
                      src={file.url}
                      alt={file.originalName}
                      className="max-w-full h-auto rounded-md mx-auto"
                    />
                  ) : isPdf ? (
                    <iframe
                      src={file.url}
                      className="w-full h-[65vh]"
                      title={file.originalName}
                    />
                  ) : (
                    <div className="text-center py-10">
                      <p className="text-gray-500">
                        此文件类型不支持预览。
                      </p>
                      <p className="text-sm text-gray-400 mt-2">
                        ({file.mimetype})
                      </p>
                    </div>
                  )}
                </div>

                {/* File Info & Actions */}
                <div className="mt-6 pt-4 border-t">
                  <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                    <div>
                      <p className="text-gray-500">文件大小:</p>
                      <p className="font-medium text-gray-800">{formatFileSize(file.size)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">文件类型:</p>
                      <p className="font-medium text-gray-800">{file.mimetype}</p>
                    </div>
                    {file.description && (
                      <div className="col-span-2">
                        <p className="text-gray-500">描述:</p>
                        <p className="font-medium text-gray-800">{file.description}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-gray-500">上传时间:</p>
                      <p className="font-medium text-gray-800">
                        {new Date(file.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button
                      onClick={onDownload}
                      variant="primary"
                      icon={ArrowDownTrayIcon}
                    >
                      下载文件
                    </Button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
