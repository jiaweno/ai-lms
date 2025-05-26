import { useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { useAuthStore } from '@/store/authStore'
import { useDashboardData } from '@/hooks/useDashboardData'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { LearningRadarChart } from '@/components/dashboard/LearningRadarChart'
import { LearningTrendChart } from '@/components/dashboard/LearningTrendChart'
import { ActivityTimeline } from '@/components/dashboard/ActivityTimeline'
import { ProgressBar } from '@/components/dashboard/ProgressBar'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Alert } from '@/components/ui/Alert'
import {
  BookOpenIcon,
  ChartBarIcon,
  ClockIcon,
  AcademicCapIcon,
  SparklesIcon,
  FireIcon,
} from '@heroicons/react/24/outline'
import { cn } from '@/utils/cn' // Import cn utility

export default function DashboardPage() {
  const { user } = useAuthStore()
  const {
    stats,
    progress,
    activities,
    trend,
    isLoading,
    error,
    refetch,
    loadMoreActivities,
    hasMoreActivities,
    timeRange,
    setTimeRange,
  } = useDashboardData()

  useEffect(() => {
    // Refresh data on mount
    refetch()
  }, [])

  const userName = user?.name || '用户'
  const userRole = user?.role === 'ADMIN' ? '管理员' : user?.role === 'TEACHER' ? '教师' : '学生'

  if (isLoading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="error" showIcon>
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
      </div>
    )
  }

  const statsData = [
    {
      title: '累计学习时长',
      value: stats ? `${Math.floor(stats.totalLearningTime / 60)}小时` : '0小时',
      icon: ClockIcon,
      trend: stats?.comparisonData.timeChange
        ? { value: stats.comparisonData.timeChange, isPositive: stats.comparisonData.timeChange > 0 }
        : undefined,
      iconColor: 'text-blue-500',
    },
    {
      title: '完成课程',
      value: stats?.completedCourses || 0,
      icon: BookOpenIcon,
      trend: stats?.comparisonData.coursesChange
        ? { value: stats.comparisonData.coursesChange, isPositive: stats.comparisonData.coursesChange > 0 }
        : undefined,
      iconColor: 'text-green-500',
    },
    {
      title: '平均得分',
      value: stats ? `${stats.averageScore}%` : '0%',
      icon: ChartBarIcon,
      trend: stats?.comparisonData.scoreChange
        ? { value: stats.comparisonData.scoreChange, isPositive: stats.comparisonData.scoreChange > 0 }
        : undefined,
      iconColor: 'text-purple-500',
    },
    {
      title: '连续学习',
      value: stats ? `${stats.currentStreak}天` : '0天',
      icon: FireIcon,
      iconColor: 'text-orange-500',
    },
  ]

  return (
    <div className="container mx-auto px-4 py-8">
      <Helmet>
        <title>仪表盘 - AI学习管理系统</title>
      </Helmet>

      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          欢迎回来，{userName}！
        </h1>
        <p className="text-gray-600 text-lg">
          您当前的身份是：<span className="font-semibold text-primary-600">{userRole}</span>
          {stats?.currentStreak && stats.currentStreak > 0 && (
            <span className="ml-2">
              🔥 您已连续学习 {stats.currentStreak} 天！
            </span>
          )}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsData.map((stat) => (
          <StatsCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            trend={stat.trend}
            iconColor={stat.iconColor}
          />
        ))}
      </div>

      {/* Time Range Selector */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">数据分析</h2>
        <div className="flex space-x-2">
          {['week', 'month', 'all'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range as any)}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-md transition-colors',
                timeRange === range
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              )}
            >
              {range === 'week' ? '本周' : range === 'month' ? '本月' : '全部'}
            </button>
          ))}
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {progress && progress.skillRadarData.length > 0 && (
          <LearningRadarChart data={progress.skillRadarData} />
        )}
        {trend && trend.trend.length > 0 && (
          <LearningTrendChart data={trend.trend} />
        )}
      </div>

      {/* Progress Section */}
      {progress && progress.pathProgress.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">学习路径进度</h3>
          <div className="space-y-4">
            {progress.pathProgress.map((path:any) => ( // Added :any to path
              <div key={path.pathId}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">{path.pathTitle}</span>
                  <span className="text-sm text-gray-500">
                    {path.completedNodes}/{path.totalNodes} 已完成
                  </span>
                </div>
                <ProgressBar
                  value={path.progressPercent}
                  max={100}
                  className="h-2"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Activity Timeline */}
      {activities && (
        <ActivityTimeline
          activities={activities.activities}
          onLoadMore={loadMoreActivities}
          hasMore={hasMoreActivities}
          isLoading={isLoading}
        />
      )}
    </div>
  )
}
