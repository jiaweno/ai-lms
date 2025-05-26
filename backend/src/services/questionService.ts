import { prisma } from '@/config/database'
import { cache } from '@/config/redis'
import { logger } from '@/utils/logger'
import { v4 as uuidv4 } from 'uuid'

interface CreateQuestionData {
  title: string
  content: any
  type: string // Should be QuestionType from Prisma
  difficulty?: string // Should be DifficultyLevel from Prisma
  points?: number
  timeLimit?: number
  explanation?: string
  tags?: string[] // Prisma schema uses Json for tags, this should be handled
  options?: Array<{
    content: string
    isCorrect: boolean
    explanation?: string
  }>
}

interface QueryQuestionsParams {
  page: number
  limit: number
  type?: string // Should be QuestionType
  difficulty?: string // Should be DifficultyLevel
  tag?: string
  search?: string
}

export const questionService = {
  async createQuestion(userId: string, data: CreateQuestionData) {
    const questionId = uuidv4()
    
    const question = await prisma.question.create({
      data: {
        id: questionId,
        title: data.title,
        content: data.content, // Ensure this matches JSON structure if your schema expects specific fields
        type: data.type as any, 
        difficulty: (data.difficulty as any) || 'INTERMEDIATE', 
        points: data.points || 1,
        timeLimit: data.timeLimit,
        explanation: data.explanation,
        tags: data.tags || [], // Prisma expects Json, so ensure this is correctly formatted
        createdById: userId,
      },
    })

    if (data.options && data.options.length > 0) {
      await prisma.questionOption.createMany({
        data: data.options.map((option, index) => ({
          id: uuidv4(),
          questionId: question.id,
          content: option.content,
          isCorrect: option.isCorrect,
          order: index,
          explanation: option.explanation,
        })),
      })
    }

    const fullQuestion = await this.getQuestionById(question.id)
    await cache.invalidatePattern('questions:*')
    logger.info(`Question created: ${question.id} by user ${userId}`)
    return fullQuestion
  },

  async getQuestions(params: QueryQuestionsParams) {
    const { page, limit, type, difficulty, tag, search } = params
    const skip = (page - 1) * limit
    const cacheKey = `questions:list:${JSON.stringify(params)}`
    const cached = await cache.get(cacheKey)
    if (cached) return cached

    const where: any = {}
    if (type) where.type = type
    if (difficulty) where.difficulty = difficulty
    if (tag) where.tags = { has: tag } // Prisma JSON `has` filter for array of strings
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { explanation: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [questions, total] = await prisma.$transaction([
      prisma.question.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          options: { orderBy: { order: 'asc' } },
          createdBy: { select: { id: true, name: true, email: true } },
          _count: { select: { examQuestions: true, answers: true } },
        },
      }),
      prisma.question.count({ where }),
    ])

    const result = { questions, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } }
    await cache.set(cacheKey, result, 300)
    return result
  },

  async getQuestionById(id: string) {
    const cacheKey = `question:${id}`
    const cached = await cache.get(cacheKey)
    if (cached) return cached

    const question = await prisma.question.findUnique({
      where: { id },
      include: {
        options: { orderBy: { order: 'asc' } },
        createdBy: { select: { id: true, name: true, email: true } },
        _count: { select: { examQuestions: true, answers: true } },
      },
    })
    if (question) await cache.set(cacheKey, question, 3600)
    return question
  },

  async updateQuestion(id: string, userId: string, data: Partial<CreateQuestionData>) {
    const existingQuestion = await prisma.question.findUnique({ where: { id }, select: { createdById: true } })
    if (!existingQuestion) throw new Error('Question not found')
    if (existingQuestion.createdById !== userId) throw new Error('Access denied')

    const question = await prisma.question.update({
      where: { id },
      data: {
        title: data.title,
        content: data.content,
        type: data.type as any,
        difficulty: data.difficulty as any,
        points: data.points,
        timeLimit: data.timeLimit,
        explanation: data.explanation,
        tags: data.tags,
        updatedAt: new Date(),
      },
    })

    if (data.options) {
      await prisma.questionOption.deleteMany({ where: { questionId: id } })
      if (data.options.length > 0) {
        await prisma.questionOption.createMany({
          data: data.options.map((option, index) => ({
            id: uuidv4(),
            questionId: id,
            content: option.content,
            isCorrect: option.isCorrect,
            order: index,
            explanation: option.explanation,
          })),
        })
      }
    }

    await cache.del(`question:${id}`)
    await cache.invalidatePattern('questions:*')
    return this.getQuestionById(id)
  },

  async deleteQuestion(id: string, userId: string) {
    const existingQuestion = await prisma.question.findUnique({
      where: { id },
      select: { createdById: true, _count: { select: { examQuestions: true } } },
    })
    if (!existingQuestion) throw new Error('Question not found')
    if (existingQuestion.createdById !== userId) throw new Error('Access denied')
    if (existingQuestion._count.examQuestions > 0) throw new Error('Question is being used in exams')

    await prisma.question.delete({ where: { id } })
    await cache.del(`question:${id}`)
    await cache.invalidatePattern('questions:*')
    logger.info(`Question deleted: ${id} by user ${userId}`)
  },

  async batchImportQuestions(userId: string, questionsData: CreateQuestionData[]) {
    const results = { success: 0, failed: 0, errors: [] as string[] }
    for (const qData of questionsData) {
      try {
        await this.createQuestion(userId, qData)
        results.success++
      } catch (error: any) {
        results.failed++
        results.errors.push(`题目 "${qData.title}": ${error.message}`)
      }
    }
    return results
  },

  async getQuestionStats() {
    const cacheKey = 'questions:stats'
    const cached = await cache.get(cacheKey)
    if (cached) return cached

    const [totalQuestions, questionsByType, questionsByDifficulty, recentQuestions] = await prisma.$transaction([
      prisma.question.count(),
      prisma.question.groupBy({ by: ['type'], _count: { id: true } }),
      prisma.question.groupBy({ by: ['difficulty'], _count: { id: true } }),
      prisma.question.count({ where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } }),
    ])

    const stats = {
      totalQuestions,
      questionsByType: questionsByType.reduce((acc, item) => ({ ...acc, [item.type]: item._count.id }), {}),
      questionsByDifficulty: questionsByDifficulty.reduce((acc, item) => ({ ...acc, [item.difficulty]: item._count.id }), {}),
      recentQuestions,
    }
    await cache.set(cacheKey, stats, 3600)
    return stats
  },

  async getRandomQuestions(params: { count: number; type?: string; difficulty?: string; excludeIds?: string[] }) {
    const { count, type, difficulty, excludeIds = [] } = params
    const where: any = {}
    if (type) where.type = type
    if (difficulty) where.difficulty = difficulty
    if (excludeIds.length > 0) where.id = { notIn: excludeIds }

    const totalCount = await prisma.question.count({ where })
    if (totalCount === 0) return []
    
    const takeCount = Math.min(count, totalCount)
    // Simplified random selection for now
    const skip = totalCount > takeCount ? Math.floor(Math.random() * (totalCount - takeCount + 1)) : 0;
    
    return prisma.question.findMany({
      where,
      skip,
      take: takeCount,
      include: { options: { orderBy: { order: 'asc' } } },
    })
  },
}
