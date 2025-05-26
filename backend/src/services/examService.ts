import { prisma } from '@/config/database'
import { cache } from '@/config/redis' // Assuming cache is an instance of CacheManager from DAY7
import { logger } from '@/utils/logger'
import { aiService } from '@/config/ai'
import { v4 as uuidv4 } from 'uuid'
import { QuestionType, DifficultyLevel, ExamType, ExamStatus, RecordStatus } from '@prisma/client' // Import enums

interface CreateExamData {
  title: string
  description?: string
  type: ExamType 
  timeLimit?: number
  passingScore?: number
  maxAttempts?: number
  startTime?: string
  endTime?: string
  settings?: any
  questionIds: string[]
}

interface QueryExamsParams {
  page: number
  limit: number
  type?: ExamType
  status?: ExamStatus
  search?: string
}

interface SubmitAnswerData {
  questionId: string
  content: any
  timeSpent?: number
}

export const examService = {
  async createExam(userId: string, data: CreateExamData) {
    const questions = await prisma.question.findMany({
      where: {
        id: { in: data.questionIds },
      },
      select: { id: true, points: true },
    })

    if (questions.length !== data.questionIds.length) {
      throw new Error('Some questions not found')
    }

    const totalPoints = questions.reduce((sum, q) => sum + q.points, 0)

    const exam = await prisma.exam.create({
      data: {
        title: data.title,
        description: data.description,
        type: data.type,
        status: 'DRAFT', 
        timeLimit: data.timeLimit,
        totalPoints,
        passingScore: data.passingScore,
        maxAttempts: data.maxAttempts || 1,
        startTime: data.startTime ? new Date(data.startTime) : null,
        endTime: data.endTime ? new Date(data.endTime) : null,
        settings: data.settings || {},
        createdById: userId,
      },
    })

    await prisma.examQuestion.createMany({
      data: data.questionIds.map((questionId, index) => ({
        id: uuidv4(),
        examId: exam.id,
        questionId,
        order: index,
        points: questions.find(q => q.id === questionId)?.points || 1,
      })),
    })

    await prisma.examStats.create({
      data: {
        examId: exam.id,
      },
    })

    logger.info(`Exam created: ${exam.id} by user ${userId}`)
    return this.getExamById(exam.id, userId)
  },

  async getExams(userId: string, userRole: 'STUDENT' | 'TEACHER' | 'ADMIN', params: QueryExamsParams) {
    const { page, limit, type, status, search } = params
    const skip = (page - 1) * limit
    const where: any = {}

    if (userRole === 'STUDENT') {
      where.status = 'PUBLISHED'
      const now = new Date();
      where.OR = [
        { startTime: null, endTime: null },
        { startTime: { lte: now }, endTime: null },
        { startTime: null, endTime: { gte: now } },
        { startTime: { lte: now }, endTime: { gte: now } },
      ];
    } else { 
        if (status) {
            where.status = status;
        }
    }

    if (type) {
      where.type = type
    }
    if (search) {
      const searchOR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
      if (where.OR) {
        where.AND = [{OR: where.OR}, {OR: searchOR}]
        delete where.OR
      } else {
        where.OR = searchOR;
      }
    }

    const [exams, total] = await prisma.$transaction([
      prisma.exam.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: { select: { id: true, name: true, email: true } },
          _count: { select: { questions: true, records: true } },
          ...(userRole === 'STUDENT' && {
            records: {
              where: { userId },
              select: { id: true, status: true, score: true, submittedAt: true },
              orderBy: { startedAt: 'desc' },
            },
          }),
        },
      }),
      prisma.exam.count({ where }),
    ]);

    return {
      exams,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }
  },

  async getExamById(id: string, userId?: string) {
    const includeClause: any = {
      createdBy: { select: { id: true, name: true, email: true } },
      questions: {
        orderBy: { order: 'asc' },
        include: {
          question: {
            include: {
              options: { orderBy: { order: 'asc' } },
            },
          },
        },
      },
      _count: { select: { records: true } },
    }

    if (userId) {
      includeClause.records = {
        where: { userId },
        orderBy: { startedAt: 'desc' },
        // For a student taking an exam, we'd typically fetch the IN_PROGRESS or latest SUBMITTED one.
        // This logic might need to be more specific based on use case (e.g., viewing results vs taking exam).
        // For now, taking the latest one or the one in progress.
        take: 1, 
      }
    }

    return prisma.exam.findUnique({
      where: { id },
      include: includeClause,
    })
  },
  
  async getExamRecord(examId: string, userId: string, recordId?: string) {
    // If a specific recordId is provided, fetch that.
    if (recordId) {
        return prisma.examRecord.findUnique({
            where: { id: recordId, userId, examId }, // Ensure user owns the record for this exam
            include: { answers: true }
        });
    }
    // Otherwise, fetch the latest active (IN_PROGRESS) record for this exam and user.
    return prisma.examRecord.findFirst({
        where: { examId, userId, status: 'IN_PROGRESS' },
        orderBy: { startedAt: 'desc' }, // Get the most recent active attempt
        include: { answers: true }
    });
  },

  async startExam(examId: string, userId: string, metadata: any) {
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: { _count: { select: { records: { where: { userId } } } } },
    })

    if (!exam) throw new Error('Exam not found')
    if (exam.status !== 'PUBLISHED' && exam.status !== 'ACTIVE') throw new Error('Exam not available') // Allow ACTIVE if re-entry is permitted

    const now = new Date()
    if (exam.startTime && now < exam.startTime) throw new Error('Exam not started yet')
    if (exam.endTime && now > exam.endTime) throw new Error('Exam has ended')
    
    const userAttempts = await prisma.examRecord.count({
        where: { examId, userId }
    });
    if (userAttempts >= exam.maxAttempts) throw new Error('Max attempts exceeded')

    const existingInProgressRecord = await prisma.examRecord.findFirst({
      where: { examId, userId, status: 'IN_PROGRESS' },
    })
    if (existingInProgressRecord) return existingInProgressRecord

    const examRecord = await prisma.examRecord.create({
      data: {
        examId,
        userId,
        totalPoints: exam.totalPoints,
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
        metadata: { startTime: now.toISOString() },
        status: 'IN_PROGRESS',
      },
    })

    await cache.del(`exam:${examId}:user:${userId}:latestRecord`) // Invalidate cache for latest record
    logger.info(`Exam started: Record ${examRecord.id} for Exam ${examId} by user ${userId}`)
    return examRecord
  },

  async submitAnswer(examRecordId: string, userId: string, answerData: SubmitAnswerData) {
    const examRecord = await prisma.examRecord.findFirst({
      where: { id: examRecordId, userId, status: 'IN_PROGRESS' },
    })
    if (!examRecord) throw new Error('No active exam record found or access denied')

    const question = await prisma.question.findUnique({
      where: { id: answerData.questionId },
      include: { options: true },
    })
    if (!question) throw new Error('Question not found')

    const gradingResult = await this.gradeAnswer(question, answerData.content)

    return prisma.answer.upsert({
      where: { recordId_questionId: { recordId: examRecord.id, questionId: answerData.questionId } },
      update: { content: answerData.content, isCorrect: gradingResult.isCorrect, score: gradingResult.score, timeSpent: answerData.timeSpent, submittedAt: new Date() },
      create: { recordId: examRecord.id, questionId: answerData.questionId, content: answerData.content, isCorrect: gradingResult.isCorrect, score: gradingResult.score, timeSpent: answerData.timeSpent },
    })
  },
  
  async batchSubmitAnswers(examRecordId: string, userId: string, answers: SubmitAnswerData[]) {
    const results = [];
    for (const answerData of answers) {
        try {
            const result = await this.submitAnswer(examRecordId, userId, answerData);
            results.push(result);
        } catch (error: any) {
            logger.error(`Failed to submit answer for question ${answerData.questionId} in record ${examRecordId}:`, error);
            results.push({ error: error.message, questionId: answerData.questionId });
        }
    }
    return results;
  },

  async finishExam(examRecordId: string, userId: string) {
    const examRecord = await prisma.examRecord.findFirst({
      where: { id: examRecordId, userId, status: 'IN_PROGRESS' },
      include: { answers: true, exam: true },
    })
    if (!examRecord) throw new Error('No active exam record found or access denied')

    const totalScore = examRecord.answers.reduce((sum, answer) => sum + (answer.score || 0), 0)
    const timeSpent = Math.floor((new Date().getTime() - examRecord.startedAt.getTime()) / 1000)

    const finishedRecord = await prisma.examRecord.update({
      where: { id: examRecord.id },
      data: { status: 'SUBMITTED', score: totalScore, submittedAt: new Date(), timeSpent },
    })

    await this.updateExamStats(examRecord.examId)
    await prisma.learningActivity.create({
      data: {
        userId,
        type: 'QUIZ_TAKEN',
        title: '完成考试',
        description: `完成了考试：${examRecord.exam.title}，得分：${totalScore}`,
        metadata: { examId: examRecord.examId, recordId: examRecord.id, score: totalScore, totalPoints: examRecord.totalPoints },
      },
    })

    logger.info(`Exam finished: Record ${examRecord.id} by user ${userId}, score: ${totalScore}`)
    return finishedRecord
  },

  async getExamResult(examRecordId: string, userId: string) {
    const examRecord = await prisma.examRecord.findFirst({
      where: { id: examRecordId, userId, status: { in: ['SUBMITTED', 'GRADED'] } },
      include: {
        exam: { select: { title: true, totalPoints: true, passingScore: true } },
        answers: { include: { question: { select: { id: true, title: true, type: true, points: true, explanation: true, options:true } } } },
      },
    })
    if (!examRecord) return null

    const correctAnswers = examRecord.answers.filter(a => a.isCorrect).length
    const totalQuestions = examRecord.answers.length
    const accuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0
    const passed = examRecord.exam.passingScore ? (examRecord.score || 0) >= examRecord.exam.passingScore : null

    return {
      ...examRecord,
      statistics: { correctAnswers, totalQuestions, accuracy: Math.round(accuracy * 100) / 100, passed },
    }
  },

  async getExamStats(examId: string) {
    const [exam, records] = await Promise.all([ // Renamed examStats to exam
      prisma.exam.findUnique({ where: { examId }, include: { _count: {select: {records: true}}}}), // Fetch exam details
      prisma.examRecord.findMany({
        where: { examId, status: { in: ['SUBMITTED', 'GRADED'] } },
        select: { score: true, timeSpent: true },
      }),
    ]);
  
    if (!exam || records.length === 0) { // Check if exam exists
      return { totalAttempts: 0, avgScore: 0, maxScore: 0, minScore: 0, passRate: 0, avgTimeSpent: 0 };
    }
  
    const scores = records.map(r => r.score || 0);
    const timesSpent = records.map(r => r.timeSpent || 0).filter(t => t > 0);
    const passedCount = exam.passingScore ? scores.filter(score => score >= exam.passingScore!).length : 0;

    const statsData = {
      totalAttempts: records.length,
      avgScore: scores.reduce((sum, s) => sum + s, 0) / scores.length,
      maxScore: Math.max(...scores),
      minScore: Math.min(...scores),
      passRate: (passedCount / records.length) * 100,
      avgTimeSpent: timesSpent.length > 0 ? timesSpent.reduce((sum, time) => sum + time, 0) / timesSpent.length : 0,
    };

    // Upsert ExamStats
     await prisma.examStats.upsert({
        where: { examId },
        update: statsData,
        create: { examId, ...statsData },
    });
  
    return statsData;
  },

  async publishExam(examId: string, userId: string) {
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      select: { createdById: true, status: true },
    })
    if (!exam) throw new Error('Exam not found')
    if (exam.createdById !== userId) throw new Error('Access denied') // Ensure only creator can publish
    if (exam.status !== 'DRAFT') throw new Error('Only draft exams can be published')

    const publishedExam = await prisma.exam.update({
      where: { id: examId },
      data: { status: 'PUBLISHED' },
    })
    logger.info(`Exam published: ${examId} by user ${userId}`)
    return publishedExam
  },

  async gradeAnswer(question: any, userAnswer: any): Promise<{ isCorrect: boolean | null; score: number, feedback?: string, needsManualGrading?: boolean }> {
    switch (question.type as QuestionType) {
      case 'SINGLE_CHOICE':
        const correctSingle = question.options.find((opt: any) => opt.isCorrect)?.id === userAnswer
        return { isCorrect: correctSingle, score: correctSingle ? question.points : 0 }
      case 'MULTIPLE_CHOICE':
        const correctOptions = question.options.filter((opt: any) => opt.isCorrect).map((opt: any) => opt.id)
        const userOptions = Array.isArray(userAnswer) ? userAnswer : []
        const correctSelectedCount = userOptions.filter((id: string) => correctOptions.includes(id)).length
        const incorrectSelectedCount = userOptions.filter((id: string) => !correctOptions.includes(id)).length
        // Full points only if all correct and no incorrect are selected.
        // Partial credit: (correctSelected - incorrectSelected) / totalCorrectOptions * question.points
        // No negative scores.
        const score = correctOptions.length > 0 
            ? Math.max(0, (correctSelectedCount - incorrectSelectedCount) / correctOptions.length) * question.points
            : 0;
        return { isCorrect: correctSelectedCount === correctOptions.length && incorrectSelectedCount === 0, score: Math.round(score * 100) / 100 }
      case 'TRUE_FALSE':
        const chosenOption = question.options.find((opt: any) => opt.id === userAnswer || opt.content.toLowerCase() === String(userAnswer).toLowerCase() );
        const isCorrectTF = chosenOption ? chosenOption.isCorrect : false;
        return { isCorrect: isCorrectTF, score: isCorrectTF ? question.points : 0 };
      case 'FILL_BLANK':
        const correctBlanks = question.options.filter((opt: any) => opt.isCorrect).map((opt: any) => opt.content.toLowerCase().trim())
        const isCorrectBlank = correctBlanks.some((ans: string) => ans === (userAnswer || '').toLowerCase().trim())
        return { isCorrect: isCorrectBlank, score: isCorrectBlank ? question.points : 0 }
      case 'ESSAY':
        try {
            const prompt = `
            请评分以下简答题：
            题目：${question.title}
            题目内容：${JSON.stringify(question.content)}
            标准答案/评分标准：${question.explanation || '无明确标准答案'}
            学生答案：${userAnswer || '未作答'}
            请按以下格式返回评分结果（JSON格式）：
            {
              "score": 0-${question.points}, 
              "feedback": "评分理由和建议",
              "isCorrect": true/false 
            }
            评分标准：答案正确性和完整性, 表达清晰度, 逻辑性. 如果学生未作答或答案完全错误，给0分.
            确保 "score" 是一个数字. "isCorrect" 应该基于答案是否基本达到要求。
            `;
            const response = await aiService.generateCompletion(prompt, { maxTokens: 500, temperature: 0.3 });
            const result = JSON.parse(response); 
            return {
                isCorrect: result.isCorrect === true, 
                score: Math.min(Math.max(Number(result.score) || 0, 0), question.points),
                feedback: result.feedback || ""
            };
        } catch (error) {
            logger.error('AI essay grading error:', error);
            return { isCorrect: null, score: 0, needsManualGrading: true, feedback: "AI评分失败，需要人工批阅" };
        }
      default:
        return { isCorrect: false, score: 0 }
    }
  },

  async updateExamStats(examId: string) {
    const records = await prisma.examRecord.findMany({
      where: { examId, status: { in: ['SUBMITTED', 'GRADED'] } },
      select: { score: true },
    })
    if (records.length === 0) {
         await prisma.examStats.upsert({
            where: { examId },
            update: { totalAttempts: 0, avgScore: 0, maxScore: 0, minScore: 0, passRate: 0 },
            create: { examId, totalAttempts: 0, avgScore: 0, maxScore: 0, minScore: 0, passRate: 0 },
        });
        return;
    }

    const scores = records.map(r => r.score || 0)
    const exam = await prisma.exam.findUnique({ where: { id: examId }, select: { passingScore: true } })
    const passedCount = exam?.passingScore ? scores.filter(score => score >= exam.passingScore!).length : 0

    const statsUpdateData = {
      totalAttempts: records.length,
      avgScore: scores.reduce((sum, s) => sum + s, 0) / scores.length,
      maxScore: Math.max(...scores),
      minScore: Math.min(...scores),
      passRate: (passedCount / records.length) * 100,
    };

    await prisma.examStats.upsert({
      where: { examId },
      update: statsUpdateData,
      create: { examId, ...statsUpdateData },
    })
  },
}
