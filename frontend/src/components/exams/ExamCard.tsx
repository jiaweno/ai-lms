import React from 'react'
import { ClockIcon, DocumentTextIcon, UsersIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { Button } from '@/components/ui/Button'
import { cn } from '@/utils/cn'

interface ExamCardProps {
  exam: {
    id: string
    title: string
    description?: string
    type: string
    status: string
    timeLimit?: number
    totalPoints: number
    maxAttempts: number
    startTime?: string
    endTime?: string
    createdAt: string
    createdBy: {
      name: string
    }
    _count: {
      questions: number
      records: number
    }
    records?: Array<{ // This should be an array of ExamRecord for the user
      id: string
      status: string
      score?: number
      submittedAt?: string
    }>
  }
  onStart?: () => void
  onClick: () => void
}

const examTypeLabels: Record<string, string> = { // Added type annotation
  CHAPTER_TEST: '章节测试',
  MOCK_EXAM: '模拟考试',
  REAL_EXAM: '真题考试',
  PRACTICE: '练习模式',
}

const examStatusLabels: Record<string, string> = { // Added type annotation
  DRAFT: '草稿',
  PUBLISHED: '已发布',
  ACTIVE: '进行中',
  ENDED: '已结束',
  CANCELLED: '已取消',
}

export const ExamCard: React.FC<ExamCardProps> = ({
  exam,
  onStart,
  onClick,
}) => {
  const userRecord = exam.records?.[0] // Assuming the relevant record is the first one
  const canStart = exam.status === 'PUBLISHED' && (!userRecord || userRecord.status !== 'SUBMITTED' && userRecord.status !== 'GRADED')
  const hasAttempted = userRecord && (userRecord.status === 'SUBMITTED' || userRecord.status === 'GRADED')
  
  const now = new Date()
  const isTimeValid = (!exam.startTime || now >= new Date(exam.startTime)) &&
                     (!exam.endTime || now <= new Date(exam.endTime))

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return 'text-green-600 bg-green-100'
      case 'ACTIVE':
        return 'text-blue-600 bg-blue-100'
      case 'ENDED':
        return 'text-gray-600 bg-gray-100'
      case 'DRAFT':
        return 'text-yellow-600 bg-yellow-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div
      className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer overflow-hidden flex flex-col h-full" // Added flex for layout
      onClick={onClick}
    >
      <div className="p-6 flex-grow"> {/* Added flex-grow */}
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-2">{exam.title}</h3>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-gray-500">
                {examTypeLabels[exam.type] || exam.type}
              </span>
              <span className={cn(
                'px-2 py-0.5 rounded-full text-xs font-medium', // Adjusted padding
                getStatusColor(exam.status)
              )}>
                {examStatusLabels[exam.status] || exam.status}
              </span>
            </div>
          </div>
        </div>

        {/* Description */}
        {exam.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-3">{exam.description}</p>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-4 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <DocumentTextIcon className="h-4 w-4 flex-shrink-0" />
            <span>{exam._count.questions} 题</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <span className="text-orange-500 text-base">★</span> {/* Star icon */}
            <span>{exam.totalPoints} 分</span>
          </div>
          {exam.timeLimit && (
            <div className="flex items-center gap-2 text-gray-600">
              <ClockIcon className="h-4 w-4 flex-shrink-0" />
              <span>{exam.timeLimit} 分钟</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-gray-600">
            <UsersIcon className="h-4 w-4 flex-shrink-0" />
            <span>{exam._count.records} 人参加</span>
          </div>
        </div>

        {/* User Status */}
        {hasAttempted && userRecord && (
          <div className="mb-4 p-3 bg-green-50 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircleIcon className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">已完成</span>
            </div>
            <div className="text-sm text-green-700 mt-1">
              得分：{userRecord.score ?? 'N/A'} / {exam.totalPoints}
              {userRecord.submittedAt && (
                <span className="ml-2 text-xs">
                  • {formatDistanceToNow(new Date(userRecord.submittedAt), {
                    addSuffix: true,
                    locale: zhCN,
                  })}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Time constraints */}
        {(exam.startTime || exam.endTime) && (
          <div className="mb-4 text-xs text-gray-500">
            {exam.startTime && (
              <div>开始时间：{new Date(exam.startTime).toLocaleString()}</div>
            )}
            {exam.endTime && (
              <div>结束时间：{new Date(exam.endTime).toLocaleString()}</div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-3 bg-gray-50 flex items-center justify-between mt-auto"> {/* Added mt-auto */}
        <span className="text-sm text-gray-500 truncate">
          {exam.createdBy.name} • {formatDistanceToNow(new Date(exam.createdAt), {
            addSuffix: true,
            locale: zhCN,
          })}
        </span>
        
        {onStart && canStart && isTimeValid && (
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation(); // Prevent card click when button is clicked
              onStart();
            }}
          >
            {userRecord && userRecord.status === 'IN_PROGRESS' ? '继续考试' : '开始考试'}
          </Button>
        )}
      </div>
    </div>
  )
}
