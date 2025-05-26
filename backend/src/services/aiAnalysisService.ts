import { aiService } from '@/config/ai'
import { prisma } from '@/config/database'
import { documentService } from './documentService'
import { logger } from '@/utils/logger'
import { cache } from '@/config/redis'

interface KnowledgePoint {
  id: string
  title: string
  description: string
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
  prerequisites: string[]
  estimatedTime: number // minutes
  keywords: string[]
  importance: number // 1-10
}

interface LearningPath {
  title: string
  description: string
  totalDuration: number
  difficulty: string
  nodes: LearningNode[]
  analysisId?: string // Added for linking back to AIAnalysis
}

interface LearningNode {
  id: string
  title: string
  description: string
  type: 'CONCEPT' | 'PRACTICE' | 'ASSESSMENT' | 'RESOURCE'
  duration: number
  prerequisites: string[]
  resources: string[]
  order: number
}

export const aiAnalysisService = {
  async analyzeDocument(fileId: string, userId: string): Promise<{
    analysisId: string, // Added to return the ID of the analysis
    knowledgePoints: KnowledgePoint[]
    suggestedPaths: LearningPath[]
  }> {
    // Check cache first
    const cacheKey = `ai:analysis:${fileId}`
    const cached = await cache.get(cacheKey)
    if (cached) {
      logger.info(`Cache hit for AI analysis of file ${fileId}`)
      return cached as any
    }
    
    logger.info(`Starting AI analysis for file ${fileId}, user ${userId}`)
    // Parse document
    const document = await documentService.parseDocument(fileId)
    const chunks = await documentService.preprocessForAI(document)
    
    // Extract knowledge points
    const knowledgePoints = await this.extractKnowledgePoints(chunks, document.title)
    
    // Generate learning paths
    const suggestedPaths = await this.generateLearningPaths(knowledgePoints, document.title)
    
    // Save to database and get the ID
    const savedAnalysis = await this.saveAnalysisResults(fileId, userId, { knowledgePoints, suggestedPaths })
    
    const result = { 
      analysisId: savedAnalysis.id, 
      knowledgePoints, 
      suggestedPaths: suggestedPaths.map(p => ({ ...p, analysisId: savedAnalysis.id })) 
    }
    
    // Cache result
    await cache.set(cacheKey, result, 3600 * 24) // 24 hours
    logger.info(`AI analysis for file ${fileId} completed and cached. Analysis ID: ${savedAnalysis.id}`)
    
    return result
  },

  async extractKnowledgePoints(chunks: string[], documentTitle: string): Promise<KnowledgePoint[]> {
    const knowledgePoints: KnowledgePoint[] = []
    
    for (const chunk of chunks) {
      const prompt = `
分析以下文本内容，提取关键知识点。请以JSON格式返回，包含以下字段：
- title: 知识点标题
- description: 简短描述（50字以内）
- difficulty: 难度等级（BEGINNER/INTERMEDIATE/ADVANCED）
- prerequisites: 前置知识点（数组，若无则为空数组）
- estimatedTime: 预计学习时间（分钟，整数）
- keywords: 关键词（数组）
- importance: 重要程度（1-10整数）

文档标题：${documentTitle}
文本内容：
${chunk}

请直接返回JSON数组，不要包含其他解释文字。确保JSON格式正确。
`
      
      try {
        const response = await aiService.generateCompletion(prompt, {
          maxTokens: 1000,
          temperature: 0.3,
        })
        
        const extracted = this.parseAIResponse(response)
        if (Array.isArray(extracted)) {
          knowledgePoints.push(...extracted.map((kp, index) => ({
            id: `kp-${Date.now()}-${index}`, // Generate a temporary ID
            title: kp.title || '未命名知识点',
            description: kp.description || '',
            difficulty: kp.difficulty || 'INTERMEDIATE',
            prerequisites: Array.isArray(kp.prerequisites) ? kp.prerequisites : [],
            estimatedTime: Number.isInteger(kp.estimatedTime) ? kp.estimatedTime : 30,
            keywords: Array.isArray(kp.keywords) ? kp.keywords : [],
            importance: Number.isInteger(kp.importance) ? Math.min(Math.max(kp.importance, 1), 10) : 5,
          })))
        }
      } catch (error) {
        logger.error('Knowledge extraction error for a chunk:', error)
      }
    }
    
    return this.organizeKnowledgePoints(knowledgePoints)
  },

  async generateLearningPaths(knowledgePoints: KnowledgePoint[], documentTitle: string): Promise<LearningPath[]> {
    if (knowledgePoints.length === 0) {
        logger.warn(`No knowledge points provided to generate learning paths for document: ${documentTitle}`);
        return [];
    }
    const prompt = `
基于以下知识点，生成1-2个学习路径。每个路径应该有明确的学习目标和合理的学习顺序。

文档标题：${documentTitle}
知识点列表：
${JSON.stringify(knowledgePoints.map(kp => ({
  id: kp.id,
  title: kp.title,
  difficulty: kp.difficulty,
  prerequisites: kp.prerequisites, // These are string titles, not IDs yet
  estimatedTime: kp.estimatedTime,
})), null, 2)}

请生成学习路径，每个路径包含：
- title: 路径名称 (例如："${documentTitle} - 基础入门", "${documentTitle} - 进阶实践")
- description: 路径描述 (简要说明路径目标和内容)
- totalDuration: 总时长（自动计算所有节点时长总和）
- difficulty: 整体难度 (BEGINNER/INTERMEDIATE/ADVANCED)
- nodes: 学习节点数组，每个节点对应一个知识点，包含：
  - id: 对应知识点的ID (来自上方列表)
  - title: 节点标题 (同知识点标题)
  - description: 节点描述 (同知识点描述)
  - type: 节点类型（CONCEPT代表理论, PRACTICE代表练习, ASSESSMENT代表评估, RESOURCE代表外部资源链接）
  - duration: 时长（分钟，同知识点estimatedTime）
  - prerequisites: 前置节点ID数组 (此路径内的节点ID)
  - resources: 推荐资源URL或描述 (可选, string[])
  - order: 节点在此路径中的顺序 (从1开始)

确保节点ID与知识点ID一致。prerequisites应为路径内其他节点的ID。
请直接返回JSON数组格式的学习路径，不要包含其他解释文字。确保JSON格式正确。
`
    
    try {
      const response = await aiService.generateCompletion(prompt, {
        maxTokens: 2000,
        temperature: 0.5,
      })
      
      const paths = this.parseAIResponse(response)
      if (Array.isArray(paths)) {
        return paths.map(p => ({
            ...p,
            nodes: p.nodes || [], // Ensure nodes is always an array
            totalDuration: (p.nodes || []).reduce((sum: number, node: any) => sum + (node.duration || 0), 0)
        }));
      }
    } catch (error) {
      logger.error('Learning path generation error:', error)
    }
    
    return [this.generateBasicPath(knowledgePoints, documentTitle)]
  },

  parseAIResponse(response: string): any {
    try {
      const jsonMatch = response.match(/(\[[\s\S]*\]|\{[\s\S]*\})(?:\s*;?\s*$)?/);
      if (jsonMatch && jsonMatch[1]) {
        return JSON.parse(jsonMatch[1]);
      }
      logger.warn('No JSON found in AI response or failed to parse:', response);
    } catch (error) {
      logger.error('Failed to parse AI response JSON:', error, 'Response was:', response);
    }
    return null
  },

  organizeKnowledgePoints(points: KnowledgePoint[]): KnowledgePoint[] {
    const uniqueMap = new Map<string, KnowledgePoint>()
    points.forEach(point => {
      const normalizedTitle = point.title.toLowerCase().trim()
      if (!uniqueMap.has(normalizedTitle)) {
        uniqueMap.set(normalizedTitle, point)
      } else {
        // Optional: merge properties if a duplicate is found, e.g., longer description
        const existing = uniqueMap.get(normalizedTitle)!
        if (point.description.length > existing.description.length) {
          existing.description = point.description
        }
        // Could also merge keywords, etc.
      }
    })
    
    const unique = Array.from(uniqueMap.values())
    
    return unique.sort((a, b) => {
      const difficultyOrder = { BEGINNER: 1, INTERMEDIATE: 2, ADVANCED: 3 }
      if (difficultyOrder[a.difficulty] !== difficultyOrder[b.difficulty]) {
        return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty]
      }
      return b.importance - a.importance
    })
  },

  calculateSimilarity(str1: string, str2: string): number {
    const s1 = str1.toLowerCase().trim()
    const s2 = str2.toLowerCase().trim()
    if (s1 === s2) return 1
    const editDistance = this.levenshteinDistance(s1, s2)
    return 1 - editDistance / Math.max(s1.length, s2.length || 1)
  },

  levenshteinDistance(s1: string, s2: string): number {
    if (!s1.length) return s2.length;
    if (!s2.length) return s1.length;
    const arr = [];
    for (let i = 0; i <= s2.length; i++) {
      arr[i] = [i];
      for (let j = 1; j <= s1.length; j++) {
        arr[i][j] =
          i === 0
            ? j
            : Math.min(
                arr[i - 1][j] + 1,
                arr[i][j - 1] + 1,
                arr[i - 1][j - 1] + (s1[j - 1] === s2[i - 1] ? 0 : 1)
              );
      }
    }
    return arr[s2.length][s1.length];
  },

  generateBasicPath(knowledgePoints: KnowledgePoint[], documentTitle: string): LearningPath {
    const nodes: LearningNode[] = knowledgePoints.map((kp, index) => ({
      id: kp.id,
      title: kp.title,
      description: kp.description,
      type: 'CONCEPT',
      duration: kp.estimatedTime,
      prerequisites: index > 0 ? [knowledgePoints[index - 1].id] : [],
      resources: [],
      order: index + 1,
    }))
    
    return {
      title: `${documentTitle} - 基础学习路径`,
      description: `系统学习 ${documentTitle} 的基础知识。`,
      totalDuration: nodes.reduce((sum, node) => sum + node.duration, 0),
      difficulty: 'INTERMEDIATE', // Or calculate based on average KP difficulty
      nodes,
    }
  },

  async saveAnalysisResults(fileId: string, userId: string, results: { knowledgePoints: Omit<KnowledgePoint, 'id'>[], suggestedPaths: Omit<LearningPath, 'analysisId'>[] }) {
    return prisma.aIAnalysis.create({
      data: {
        fileId,
        userId,
        knowledgePoints: results.knowledgePoints, // Prisma expects Json type
        suggestedPaths: results.suggestedPaths,   // Prisma expects Json type
        status: 'COMPLETED',
      },
    })
  },
}
