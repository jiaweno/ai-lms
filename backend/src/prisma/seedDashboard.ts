import { PrismaClient, ContentType, ActivityType } from '@prisma/client'
import { logger } from '../utils/logger'
import { subDays, addMinutes } from 'date-fns'

const prisma = new PrismaClient()

export async function seedDashboardData() {
  logger.info('🌱 Seeding dashboard-related data...')

  // Get users and learning paths created in the basic seed
  const student1 = await prisma.user.findUnique({ where: { email: 'student1@ai-lms.com' } })
  const student2 = await prisma.user.findUnique({ where: { email: 'student2@ai-lms.com' } })
  const mathPath = await prisma.learningPath.findUnique({ where: { id: 'math-path-1' } })
  const csPath = await prisma.learningPath.findUnique({ where: { id: 'cs-path-1' } })

  if (!student1 || !student2 || !mathPath || !csPath) {
    logger.warn('⚠️  Required users or learning paths not found. Skipping dashboard data seeding.')
    return
  }

  // Seed Learning Records
  logger.info('📝 Seeding learning records...')
  const learningRecords = []
  const today = new Date()

  for (let i = 0; i < 30; i++) { // Last 30 days of activity
    const date = subDays(today, i)
    
    // Student 1 - Math Path
    if (i % 2 === 0) { // Activity every other day
      const startTime = addMinutes(startOfDay(date), Math.floor(Math.random() * 10) * 60) // Random start time
      const duration = 30 + Math.floor(Math.random() * 90) // 30-120 minutes
      const endTime = addMinutes(startTime, duration)
      
      learningRecords.push(
        prisma.learningRecord.create({
          data: {
            userId: student1.id,
            learningPathId: mathPath.id,
            learningNodeId: (await prisma.learningNode.findFirst({ where: { learningPathId: mathPath.id } }))?.id,
            startTime,
            endTime,
            duration,
            contentType: ContentType.VIDEO,
            completed: Math.random() > 0.3, // 70% chance of completion
          },
        })
      )
    }

    // Student 2 - CS Path
    if (i % 3 === 0) { // Activity every third day
      const startTime = addMinutes(startOfDay(date), Math.floor(Math.random() * 8) * 60)
      const duration = 45 + Math.floor(Math.random() * 60) // 45-105 minutes
      const endTime = addMinutes(startTime, duration)
      
      learningRecords.push(
        prisma.learningRecord.create({
          data: {
            userId: student2.id,
            learningPathId: csPath.id,
            learningNodeId: (await prisma.learningNode.findFirst({ where: { learningPathId: csPath.id } }))?.id,
            startTime,
            endTime,
            duration,
            contentType: ContentType.READING,
            completed: Math.random() > 0.4, // 60% chance
          },
        })
      )
    }
  }
  await Promise.all(learningRecords)
  logger.info(`✅ Seeded ${learningRecords.length} learning records.`)

  // Seed Study Progress (summaries)
  logger.info('📊 Seeding study progress...')
  const studyProgressData = [
    {
      userId: student1.id,
      learningPathId: mathPath.id,
      totalDuration: 15 * 60, // 15 hours
      completedNodes: 2,
      totalNodes: 3,
      progressPercent: (2 / 3) * 100,
      lastStudiedAt: subDays(today, 1),
    },
    {
      userId: student2.id,
      learningPathId: csPath.id,
      totalDuration: 10 * 60, // 10 hours
      // Assuming csPath has 2 nodes for this example
      completedNodes: 1, 
      totalNodes: (await prisma.learningNode.count({where: {learningPathId: csPath.id}})) || 2,
      progressPercent: (1 / ((await prisma.learningNode.count({where: {learningPathId: csPath.id}})) || 2)) * 100,
      lastStudiedAt: subDays(today, 2),
    },
  ]
  for (const sp of studyProgressData) {
    await prisma.studyProgress.upsert({
      where: { userId_learningPathId: { userId: sp.userId, learningPathId: sp.learningPathId } },
      update: sp,
      create: sp,
    })
  }
  logger.info(`✅ Seeded ${studyProgressData.length} study progress records.`)

  // Seed Learning Activities
  logger.info('📜 Seeding learning activities...')
  const activities = [
    prisma.learningActivity.create({
      data: {
        userId: student1.id,
        type: ActivityType.COURSE_STARTED,
        title: '开始学习数学基础',
        description: `开始了学习路径 "${mathPath.title}"`,
        metadata: { pathId: mathPath.id },
        createdAt: subDays(today, 28),
      },
    }),
    prisma.learningActivity.create({
      data: {
        userId: student1.id,
        type: ActivityType.MILESTONE_REACHED,
        title: '完成线性代数模块',
        description: '在数学基础路径中完成了一个重要模块',
        metadata: { pathId: mathPath.id, nodeId: 'math-node-1' },
        createdAt: subDays(today, 15),
      },
    }),
    prisma.learningActivity.create({
      data: {
        userId: student1.id,
        type: ActivityType.QUIZ_TAKEN,
        title: '参加了代数测验',
        description: '完成了代数基础测验，得分85%',
        metadata: { examId: 'some-quiz-id', score: 85 },
        createdAt: subDays(today, 5),
      },
    }),
    prisma.learningActivity.create({
      data: {
        userId: student2.id,
        type: ActivityType.PATH_ENROLLED,
        title: '加入计算机科学导论',
        description: `加入了学习路径 "${csPath.title}"`,
        metadata: { pathId: csPath.id },
        createdAt: subDays(today, 20),
      },
    }),
    prisma.learningActivity.create({
      data: {
        userId: student2.id,
        type: ActivityType.ACHIEVEMENT_EARNED,
        title: '获得 "编程新手" 徽章',
        description: '完成了编程入门挑战',
        metadata: { achievement: '编程新手徽章' },
        createdAt: subDays(today, 10),
      },
    }),
  ]
  await Promise.all(activities)
  logger.info(`✅ Seeded ${activities.length} learning activities.`)
  
  logger.info('🎉 Dashboard data seeding finished.')
}

function startOfDay(date: Date) {
  const newDate = new Date(date)
  newDate.setHours(0, 0, 0, 0)
  return newDate
}

// If this script is run directly, execute the seed function
if (require.main === module) {
  seedDashboardData()
    .catch((e) => {
      logger.error('❌ Dashboard seeding failed:', e)
      process.exit(1)
    })
    .finally(async () => {
      await prisma.$disconnect()
    })
}
