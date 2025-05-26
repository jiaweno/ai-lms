import React from 'react'
import { cn } from '@/utils/cn'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import {
  BookOpenIcon,
  AcademicCapIcon,
  DocumentTextIcon,
  TrophyIcon,
  FolderPlusIcon,
  PlayCircleIcon,
} from '@heroicons/react/24/outline'

interface Activity {
  id: string
  type: string
  title: string
  description?: string
  createdAt: string
  metadata?: any
}

interface ActivityTimelineProps {
  activities: Activity[]
  className?: string
  onLoadMore?: () => void
  hasMore?: boolean
  isLoading?: boolean
}

const activityIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  COURSE_STARTED: PlayCircleIcon,
  COURSE_COMPLETED: AcademicCapIcon,
  QUIZ_TAKEN: DocumentTextIcon,
  MILESTONE_REACHED: TrophyIcon,
  ACHIEVEMENT_EARNED: TrophyIcon,
  MATERIAL_UPLOADED: FolderPlusIcon,
  PATH_ENROLLED: BookOpenIcon,
}

const activityColors: Record<string, string> = {
  COURSE_STARTED: 'bg-blue-100 text-blue-800',
  COURSE_COMPLETED: 'bg-green-100 text-green-800',
  QUIZ_TAKEN: 'bg-purple-100 text-purple-800',
  MILESTONE_REACHED: 'bg-yellow-100 text-yellow-800',
  ACHIEVEMENT_EARNED: 'bg-yellow-100 text-yellow-800',
  MATERIAL_UPLOADED: 'bg-gray-100 text-gray-800',
  PATH_ENROLLED: 'bg-indigo-100 text-indigo-800',
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({
  activities,
  className,
  onLoadMore,
  hasMore = false,
  isLoading = false,
}) => {
  return (
    <div className={cn('bg-white p-6 rounded-lg shadow-sm border border-gray-200', className)}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">最近活动</h3>
      <div className="flow-root">
        <ul className="-mb-8">
          {activities.map((activity, idx) => {
            const Icon = activityIcons[activity.type] || BookOpenIcon
            const colorClass = activityColors[activity.type] || 'bg-gray-100 text-gray-800'
            
            return (
              <li key={activity.id}>
                <div className="relative pb-8">
                  {idx !== activities.length - 1 && (
                    <span
                      className="absolute left-5 top-5 -ml-px h-full w-0.5 bg-gray-200"
                      aria-hidden="true"
                    />
                  )}
                  <div className="relative flex items-start space-x-3">
                    <div className={cn(
                      'relative flex h-10 w-10 items-center justify-center rounded-full',
                      colorClass
                    )}>
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {activity.title}
                        </p>
                        {activity.description && (
                          <p className="mt-0.5 text-sm text-gray-600">
                            {activity.description}
                          </p>
                        )}
                        <p className="mt-0.5 text-xs text-gray-500">
                          {formatDistanceToNow(new Date(activity.createdAt), {
                            addSuffix: true,
                            locale: zhCN,
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
        
        {hasMore && (
          <div className="mt-6 flex justify-center">
            <button
              onClick={onLoadMore}
              disabled={isLoading}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              {isLoading ? '加载中...' : '加载更多'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
