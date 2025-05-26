import { PrismaClient, QuestionType, DifficultyLevel, ExamType, ExamStatus, RecordStatus } from '@prisma/client' 
import { v4 as uuidv4 } from 'uuid'
import { logger } from '../utils/logger'; 

const prisma = new PrismaClient()

// Helper to get a random enum value
function getRandomEnum<T extends object>(e: T): T[keyof T] {
  const keys = Object.keys(e) as (keyof T)[];
  const randomIndex = Math.floor(Math.random() * keys.length);
  return e[keys[randomIndex]];
}


export async function seedExamData() {
  logger.info('🌱 Seeding exam system data...') 

  const studentUser = await prisma.user.findUnique({ where: { email: 'student1@ai-lms.com' } });
  const teacherUser = await prisma.user.findUnique({ where: { email: 'teacher@ai-lms.com' } });


  if (!studentUser || !teacherUser) {
    logger.warn('⚠️ Test users (student1@ai-lms.com or teacher@ai-lms.com) not found. Skipping exam data seeding.');
    return;
  }
  
  const jsTag = await prisma.questionTag.upsert({
    where: { name: 'JavaScript基础' },
    update: {},
    create: { id: uuidv4(), name: 'JavaScript基础', color: '#F0DB4F' },
  });

  const reactTag = await prisma.questionTag.upsert({
    where: { name: 'React框架' },
    update: {},
    create: { id: uuidv4(), name: 'React框架', color: '#61DAFB' },
  });
  
  const algoTag = await prisma.questionTag.upsert({ 
    where: { name: '算法设计' },
    update: {},
    create: { id: uuidv4(), name: '算法设计', color: '#EF4444' },
  });


  const questionsData = [
    {
      title: 'JavaScript中哪个方法用于向数组末尾添加元素？',
      content: { text: '请选择正确的JavaScript数组方法：', type: 'text' },
      type: QuestionType.SINGLE_CHOICE,
      difficulty: DifficultyLevel.BEGINNER,
      points: 2,
      explanation: 'push()方法用于向数组末尾添加一个或多个元素，并返回新数组的长度。',
      tags: [jsTag.name], 
      createdById: teacherUser.id,
      options: [
        { content: 'push()', isCorrect: true, explanation: '正确！push()方法向数组末尾添加元素。' },
        { content: 'pop()', isCorrect: false, explanation: 'pop()方法是移除数组末尾的元素。' },
        { content: 'shift()', isCorrect: false, explanation: 'shift()方法是移除数组开头的元素。' },
        { content: 'unshift()', isCorrect: false, explanation: 'unshift()方法是向数组开头添加元素。' },
      ],
    },
    {
      title: '以下哪些是React的核心概念？',
      content: { text: '选择所有正确的React核心概念：', type: 'text' },
      type: QuestionType.MULTIPLE_CHOICE,
      difficulty: DifficultyLevel.INTERMEDIATE,
      points: 4,
      explanation: 'JSX、组件、Props、State和生命周期都是React的核心概念。',
      tags: [reactTag.name],
      createdById: teacherUser.id,
      options: [
        { content: 'JSX语法', isCorrect: true },
        { content: '组件(Components)', isCorrect: true },
        { content: 'Props属性', isCorrect: true },
        { content: 'jQuery选择器', isCorrect: false },
        { content: 'State状态', isCorrect: true },
      ],
    },
     {
      title: 'React函数组件可以使用Hooks来管理状态',
      content: { text: '请判断以下说法是否正确：React函数组件可以使用Hooks来管理状态。', type: 'text'},
      type: QuestionType.TRUE_FALSE,
      difficulty: DifficultyLevel.BEGINNER,
      points: 1,
      explanation: '正确。React Hooks允许函数组件使用状态和其他React特性。',
      tags: [reactTag.name],
      createdById: teacherUser.id,
      options: [ 
        { content: '正确', isCorrect: true }, 
        { content: '错误', isCorrect: false },
      ],
    },
    {
      title: '数组排序算法时间复杂度',
      content: { text: '快速排序算法的平均时间复杂度是____。', type: 'text' },
      type: QuestionType.FILL_BLANK,
      difficulty: DifficultyLevel.INTERMEDIATE,
      points: 3,
      explanation: '快速排序的平均时间复杂度是O(n log n)。',
      tags: [algoTag.name], 
      createdById: teacherUser.id,
      options: [ 
        { content: 'O(n log n)', isCorrect: true },
        { content: 'O(nlogn)', isCorrect: true }, 
      ],
    },
    {
      title: '解释React虚拟DOM的工作原理',
      content: {text: '请详细解释React虚拟DOM(Virtual DOM)的工作原理，以及它如何提高应用性能。', type: 'text'},
      type: QuestionType.ESSAY,
      difficulty: DifficultyLevel.ADVANCED,
      points: 10,
      explanation: '参考答案要点：1. 虚拟DOM是真实DOM的JavaScript表示... (full explanation)',
      tags: [reactTag.name],
      createdById: teacherUser.id,
    },
  ];

  const createdQuestions = [];
  for (const qData of questionsData) {
    const { options, ...questionData } = qData;
    const question = await prisma.question.create({
      data: {
        ...questionData,
        tags: questionData.tags || [], 
      },
    });
    if (options) {
      await prisma.questionOption.createMany({
        data: options.map((opt, index) => ({
          id: uuidv4(),
          questionId: question.id,
          ...opt,
          order: index,
        })),
      });
    }
    createdQuestions.push(question);
  }
  logger.info(`📝 Created ${createdQuestions.length} questions`);

  const exam = await prisma.exam.create({
    data: {
      title: '前端基础知识综合测试',
      description: '测试JavaScript基础知识和React框架的核心概念。',
      type: ExamType.CHAPTER_TEST,
      status: ExamStatus.PUBLISHED, 
      timeLimit: 60, 
      totalPoints: createdQuestions.reduce((sum, q) => sum + q.points, 0),
      passingScore: Math.round(createdQuestions.reduce((sum, q) => sum + q.points, 0) * 0.6), 
      maxAttempts: 2,
      createdById: teacherUser.id,
      settings: { shuffleQuestions: true, showResults: 'IMMEDIATELY' },
      startTime: new Date(),
      endTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 
    },
  });

  await prisma.examQuestion.createMany({
    data: createdQuestions.map((q, index) => ({
      examId: exam.id,
      questionId: q.id,
      order: index,
      points: q.points,
    })),
  });
  
  await prisma.examStats.upsert({ 
      where: { examId: exam.id },
      update: {}, // No update needed if it exists, just ensure it's there
      create: {
        examId: exam.id,
      },
  });

  logger.info(`📊 Created exam: ${exam.title}`);

  const studentExamRecord = await prisma.examRecord.create({
    data: {
      examId: exam.id,
      userId: studentUser.id,
      status: RecordStatus.SUBMITTED,
      score: 0, 
      totalPoints: exam.totalPoints,
      startedAt: new Date(Date.now() - 30 * 60 * 1000), 
      submittedAt: new Date(),
      timeSpent: 1800, 
    }
  });

  let studentScore = 0;
  const studentAnswersData = [
    { questionId: createdQuestions[0].id, content: {"selectedOptionId": (await prisma.questionOption.findFirst({where: {questionId: createdQuestions[0].id, isCorrect:true}}))?.id }, isCorrect: true, score: createdQuestions[0].points},
    { questionId: createdQuestions[1].id, content: {"selectedOptionIds": [(await prisma.questionOption.findFirst({where: {questionId: createdQuestions[1].id, content: 'JSX语法'}}))?.id]}, isCorrect: false, score: 1},
    { questionId: createdQuestions[2].id, content: {"selectedOptionId": (await prisma.questionOption.findFirst({where: {questionId: createdQuestions[2].id, isCorrect:true}}))?.id}, isCorrect: true, score: createdQuestions[2].points},
    { questionId: createdQuestions[3].id, content: {"textAnswer": "O(n log n)"}, isCorrect: true, score: createdQuestions[3].points},
    { questionId: createdQuestions[4].id, content: {"textAnswer": "虚拟DOM是React性能优化的关键。"}, isCorrect: null, score: 5},
  ];

  for(const ans of studentAnswersData){
    if(ans.content !== undefined && ans.questionId){ 
        await prisma.answer.create({
            data: {
                recordId: studentExamRecord.id,
                questionId: ans.questionId,
                content: ans.content, 
                isCorrect: ans.isCorrect,
                score: ans.score,
                timeSpent: 200, 
            }
        });
        studentScore += ans.score || 0;
    }
  }
  
  await prisma.examRecord.update({
      where: {id: studentExamRecord.id},
      data: {score: studentScore, status: RecordStatus.GRADED} 
  });

  // Use a proper service call if available, otherwise direct update
  const examServiceInstance = { // Mock or simplified instance for seeding
      async updateExamStats(examId: string) {
        const records = await prisma.examRecord.findMany({
          where: { examId, status: { in: ['SUBMITTED', 'GRADED'] } },
          select: { score: true },
        });
        if (records.length === 0) {
            await prisma.examStats.upsert({
                where: { examId },
                update: { totalAttempts: 0, avgScore: 0, maxScore: 0, minScore: 0, passRate: 0, updatedAt: new Date() },
                create: { examId, totalAttempts: 0, avgScore: 0, maxScore: 0, minScore: 0, passRate: 0 },
            });
            return;
        }

        const scores = records.map(r => r.score || 0);
        const examDetails = await prisma.exam.findUnique({ where: { id: examId }, select: { passingScore: true } });
        const passedCount = examDetails?.passingScore ? scores.filter(score => score >= examDetails.passingScore!).length : 0;
        const statsUpdateData = {
          totalAttempts: records.length,
          avgScore: scores.reduce((sum, s) => sum + s, 0) / scores.length,
          maxScore: Math.max(...scores),
          minScore: Math.min(...scores),
          passRate: (passedCount / records.length) * 100,
          updatedAt: new Date(),
        };
        await prisma.examStats.upsert({
          where: { examId },
          update: statsUpdateData,
          create: { examId, ...statsUpdateData },
        });
      }
  };
  await examServiceInstance.updateExamStats(exam.id); 

  logger.info(`🎯 Student ${studentUser.name} completed exam ${exam.title} with score ${studentScore}`);
  logger.info('✅ Exam system data seeded successfully');
}


if (require.main === module) {
  seedExamData()
    .catch((e) => {
      logger.error('❌ Exam seeding failed:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
