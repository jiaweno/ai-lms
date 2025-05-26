import { prisma } from '@/config/database'
import { subDays, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'

export const dashboardService = {
  async getUserStats(userId: string, range: string = 'week') {
    const dateRange = this.getDateRange(range)
    
    // Get learning time
    const learningRecords = await prisma.learningRecord.findMany({
      where: {
        userId,
        startTime: dateRange ? { gte: dateRange.start, lte: dateRange.end } : undefined,
      },
    })
    
    const totalLearningTime = learningRecords.reduce((sum, record) => sum + record.duration, 0)
    
    // Get completed courses count
    const completedCourses = await prisma.userProgress.count({
      where: {
        userId,
        completed: true,
        updatedAt: dateRange ? { gte: dateRange.start, lte: dateRange.end } : undefined,
      },
    })
    
    // Get active days
    const activeDays = new Set(
      learningRecords.map(record => 
        startOfDay(record.startTime).toISOString()
      )
    ).size
    
    // Get average score from exams
    const examRecords = await prisma.examRecord.findMany({
      where: {
        userId,
        submittedAt: {
          not: null,
          ...(dateRange ? { gte: dateRange.start, lte: dateRange.end } : {}),
        },
      },
      select: { score: true },
    })
    
    const averageScore = examRecords.length > 0
      ? examRecords.reduce((sum, record) => sum + (record.score || 0), 0) / examRecords.length
      : 0
    
    // Get current streak (consecutive days)
    const currentStreak = await this.calculateStreak(userId)
    
    // Get achievements count
    const achievements = await prisma.learningActivity.count({
      where: {
        userId,
        type: 'ACHIEVEMENT_EARNED',
      },
    })
    
    // Get comparison data (vs previous period)
    const comparisonData = await this.getComparisonData(userId, range)
    
    return {
      totalLearningTime,
      completedCourses,
      activeDays,
      averageScore: Math.round(averageScore * 100) / 100,
      currentStreak,
      achievements,
      comparisonData,
    }
  },

  async getUserProgress(userId: string) {
    // Get progress for all enrolled paths
    const studyProgress = await prisma.studyProgress.findMany({
      where: { userId },
      include: {
        learningPath: {
          select: {
            id: true,
            title: true,
            description: true,
          },
        },
      },
      orderBy: { lastStudiedAt: 'desc' },
    })
    
    const pathProgress = studyProgress.map(progress => ({
      pathId: progress.learningPathId,
      pathTitle: progress.learningPath.title,
      progressPercent: Math.round(progress.progressPercent * 100) / 100,
      totalDuration: progress.totalDuration,
      completedNodes: progress.completedNodes,
      totalNodes: progress.totalNodes,
      lastStudiedAt: progress.lastStudiedAt.toISOString(),
    }))
    
    // Generate skill radar data (mock for now, should be based on actual skill assessments)
    const skills = ['数学基础', '编程能力', '算法设计', '数据分析', '机器学习', '项目实践']
    const skillRadarData = skills.map(skill => ({
      skill,
      score: Math.floor(Math.random() * 80) + 20, // Mock data
      fullScore: 100,
    }))
    
    return {
      pathProgress,
      skillRadarData,
    }
  },

  async getUserActivities(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit
    
    const [activities, total] = await Promise.all([
      prisma.learningActivity.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.learningActivity.count({
        where: { userId },
      }),
    ])
    
    return {
      activities: activities.map(activity => ({
        id: activity.id,
        type: activity.type,
        title: activity.title,
        description: activity.description || '',
        createdAt: activity.createdAt.toISOString(),
        metadata: activity.metadata || {},
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  },

  async getLearningTrend(userId: string, range: 'week' | 'month' | 'year' = 'week') {
    const days = range === 'week' ? 7 : range === 'month' ? 30 : 365
    const startDate = subDays(new Date(), days - 1)
    
    const learningRecords = await prisma.learningRecord.findMany({
      where: {
        userId,
        startTime: {
          gte: startDate,
        },
      },
      orderBy: { startTime: 'asc' },
    })
    
    // Group by date
    const trendMap = new Map<string, { duration: number; count: number }>()
    
    // Initialize all dates with 0
    for (let i = 0; i < days; i++) {
      const date = subDays(new Date(), i)
      const dateKey = startOfDay(date).toISOString().split('T')[0]
      trendMap.set(dateKey, { duration: 0, count: 0 })
    }
    
    // Fill with actual data
    learningRecords.forEach(record => {
      const dateKey = startOfDay(record.startTime).toISOString().split('T')[0]
      const existing = trendMap.get(dateKey) || { duration: 0, count: 0 }
      trendMap.set(dateKey, {
        duration: existing.duration + record.duration,
        count: existing.count + 1,
      })
    })
    
    // Convert to array and sort
    const trend = Array.from(trendMap.entries())
      .map(([date, data]) => ({
        date,
        duration: data.duration,
        count: data.count,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
    
    // Calculate summary
    const totalDuration = trend.reduce((sum, day) => sum + day.duration, 0)
    const averageDuration = Math.round(totalDuration / days)
    const peakDay = trend.reduce((max, day) => 
      day.duration > max.duration ? day : max
    , trend[0])
    
    return {
      trend,
      summary: {
        totalDuration,
        averageDuration,
        peakDay: peakDay?.date || '',
        peakDuration: peakDay?.duration || 0,
      },
    }
  },

  // Helper methods
  getDateRange(range: string) {
    const now = new Date()
    
    switch (range) {
      case 'today':
        return {
          start: startOfDay(now),
          end: endOfDay(now),
        }
      case 'week':
        return {
          start: startOfWeek(now, { weekStartsOn: 1 }),
          end: endOfWeek(now, { weekStartsOn: 1 }),
        }
      case 'month':
        return {
          start: startOfMonth(now),
          end: endOfMonth(now),
        }
      case 'all':
      default:
        return null
    }
  },

  async calculateStreak(userId: string) {
    const records = await prisma.learningRecord.findMany({
      where: { userId },
      orderBy: { startTime: 'desc' },
      select: { startTime: true },
    })
    
    if (records.length === 0) return 0
    
    let streak = 0
    let currentDate = startOfDay(new Date())
    
    for (const record of records) {
      const recordDate = startOfDay(record.startTime)
      const diffDays = Math.floor((currentDate.getTime() - recordDate.getTime()) / (1000 * 60 * 60 * 24))
      
      if (diffDays === streak) {
        streak++
      } else if (diffDays > streak) {
        break
      }
    }
    
    return streak
  },

  async getComparisonData(userId: string, range: string) {
    // Mock implementation - should compare with previous period
    return {
      timeChange: Math.floor(Math.random() * 40) - 20, // -20% to +20%
      coursesChange: Math.floor(Math.random() * 10) - 5,
      scoreChange: Math.floor(Math.random() * 20) - 10,
    }
  },
}
