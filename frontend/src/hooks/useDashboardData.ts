import { useState, useEffect, useCallback } from 'react'
import { dashboardService } from '@/services/dashboardService'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'

export const useDashboardData = () => {
  const { isAuthenticated } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'all'>('week')
  
  // Data states
  const [stats, setStats] = useState<any>(null)
  const [progress, setProgress] = useState<any>(null)
  const [activities, setActivities] = useState<any>(null)
  const [trend, setTrend] = useState<any>(null)
  
  // Pagination for activities
  const [activitiesPage, setActivitiesPage] = useState(1)
  const [hasMoreActivities, setHasMoreActivities] = useState(true)

  const fetchStats = useCallback(async () => {
    if (!isAuthenticated) return
    
    try {
      const data = await dashboardService.getStats(timeRange)
      setStats(data)
    } catch (err: any) {
      console.error('Failed to fetch stats:', err)
      throw err
    }
  }, [isAuthenticated, timeRange])

  const fetchProgress = useCallback(async () => {
    if (!isAuthenticated) return
    
    try {
      const data = await dashboardService.getProgress()
      setProgress(data)
    } catch (err: any) {
      console.error('Failed to fetch progress:', err)
      throw err
    }
  }, [isAuthenticated])

  const fetchActivities = useCallback(async (page = 1, append = false) => {
    if (!isAuthenticated) return
    
    try {
      const data = await dashboardService.getActivities(page)
      
      if (append && activities) {
        setActivities({
          ...data,
          activities: [...activities.activities, ...data.activities],
        })
      } else {
        setActivities(data)
      }
      
      setHasMoreActivities(page < data.pagination.totalPages)
      setActivitiesPage(page)
    } catch (err: any) {
      console.error('Failed to fetch activities:', err)
      throw err
    }
  }, [isAuthenticated, activities])

  const fetchTrend = useCallback(async () => {
    if (!isAuthenticated) return
    
    try {
      const data = await dashboardService.getLearningTrend(timeRange === 'all' ? 'year' : timeRange)
      setTrend(data)
    } catch (err: any) {
      console.error('Failed to fetch trend:', err)
      throw err
    }
  }, [isAuthenticated, timeRange])

  const refetch = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      await Promise.all([
        fetchStats(),
        fetchProgress(),
        fetchActivities(1),
        fetchTrend(),
      ])
    } catch (err: any) {
      setError(err.message || '加载数据失败，请稍后重试')
      toast.error('加载数据失败')
    } finally {
      setIsLoading(false)
    }
  }, [fetchStats, fetchProgress, fetchActivities, fetchTrend])

  const loadMoreActivities = useCallback(async () => {
    if (!hasMoreActivities || isLoading) return
    
    setIsLoading(true)
    try {
      await fetchActivities(activitiesPage + 1, true)
    } catch (err: any) {
      toast.error('加载更多活动失败')
    } finally {
      setIsLoading(false)
    }
  }, [hasMoreActivities, isLoading, activitiesPage, fetchActivities])

  // Initial load
  useEffect(() => {
    if (isAuthenticated) {
      refetch()
    }
  }, [isAuthenticated])

  // Refetch when time range changes
  useEffect(() => {
    if (isAuthenticated && stats) {
      // Only refetch stats and trend when time range changes
      setIsLoading(true)
      Promise.all([fetchStats(), fetchTrend()])
        .catch((err) => {
          toast.error('更新数据失败')
        })
        .finally(() => {
          setIsLoading(false)
        })
    }
  }, [timeRange])

  return {
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
  }
}
