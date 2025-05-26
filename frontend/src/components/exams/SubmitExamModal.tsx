import React from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/Button'

interface SubmitExamModalProps {
  exam: {
    title: string
    timeLimit?: number
  }
  answeredCount: number
  totalQuestions: number
  onConfirm: () => void
  onCancel: () => void
}

export const SubmitExamModal: React.FC<SubmitExamModalProps> = ({
  exam,
  answeredCount,
  totalQuestions,
  onConfirm,
  onCancel,
}) => {
  const unansweredCount = totalQuestions - answeredCount
  const completionRate = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;


  return (
    <Transition appear show={true} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onCancel}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center gap-3 mb-4">
                  {unansweredCount > 0 ? (
                    <ExclamationTriangleIcon className="h-8 w-8 text-orange-500" />
                  ) : (
                    <CheckCircleIcon className="h-8 w-8 text-green-500" />
                  )}
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900"
                  >
                    确认提交考试
                  </Dialog.Title>
                </div>

                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">{exam.title}</h4>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex justify-between">
                        <span>答题进度</span>
                        <span className="font-medium">{answeredCount} / {totalQuestions}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>完成率</span>
                        <span className="font-medium">{Math.round(completionRate)}%</span>
                      </div>
                      {unansweredCount > 0 && (
                        <div className="flex justify-between text-orange-600">
                          <span>未答题目</span>
                          <span className="font-medium">{unansweredCount} 题</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {unansweredCount > 0 && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <ExclamationTriangleIcon className="h-5 w-5 text-orange-500 mt-0.5" />
                        <div className="text-sm">
                          <p className="font-medium text-orange-800">注意</p>
                          <p className="text-orange-700">
                            您还有 {unansweredCount} 道题目未答，未答题目将不会得分。
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">提交后须知：</p>
                      <ul className="list-disc list-inside space-y-1 text-blue-700">
                        <li>考试将立即结束，无法再次修改答案</li>
                        <li>系统将自动评分并生成成绩报告</li>
                        <li>简答题将由AI智能评分</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex gap-3 justify-end">
                  <Button
                    variant="outline"
                    onClick={onCancel}
                  >
                    继续答题
                  </Button>
                  <Button
                    variant="primary"
                    onClick={onConfirm}
                  >
                    确认提交
                  </Button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
