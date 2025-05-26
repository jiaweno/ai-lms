import { prisma } from '@/config/database'
import { cache } from '@/config/redis'
import { logger } from '@/utils/logger'
import { v4 as uuidv4 } from 'uuid'

interface CreatePathParams {
  title: string
  description: string
  fileId?: string
  analysisId?: string
  nodes: any[] // Define a more specific type if possible
  metadata?: Record<string, any>
}

interface UpdateNodeProgressParams {
  userId: string
  pathId: string
  nodeId: string
  completed: boolean
  timeSpent?: number
}

export const learningPathService = {
  async createPath(userId: string, params: CreatePathParams) {
    const pathId = uuidv4()
    
    const path = await prisma.learningPath.create({
      data: {
        id: pathId,
        title: params.title,
        description: params.description || '',
        createdById: userId, // Assuming relation name is createdBy and field is createdById
        isPublic: false, // Default
        estimatedDuration: this.calculateTotalDuration(params.nodes),
        difficulty: this.calculateOverallDifficulty(params.nodes),
        metadata: {
          fileId: params.fileId,
          analysisId: params.analysisId,
          ...params.metadata,
        },
      },
    })
    
    const createdNodes = await Promise.all(
      params.nodes.map((node, index) =>
        prisma.learningNode.create({
          data: {
            id: uuidv4(),
            learningPathId: path.id, // Corrected field name
            title: node.title,
            description: node.description || '',
            type: node.type,
            order: node.order || index + 1,
            duration: node.duration || 0,
            content: node.content || {}, // Assuming content is JSON
            resources: node.resources || [], // Assuming resources is JSON array
            metadata: node.metadata || {},
          },
        })
      )
    )
    
    for (const nodeData of params.nodes) {
      if (nodeData.prerequisites && nodeData.prerequisites.length > 0) {
        const currentNode = createdNodes.find(n => n.title === nodeData.title); // Assuming title is unique for this operation context
        if (currentNode) {
          for (const prereqIdOrTitle of nodeData.prerequisites) {
            // Attempt to find by ID first, then by title if it's a title string
            const prereqNode = createdNodes.find(n => n.id === prereqIdOrTitle || n.title === prereqIdOrTitle);
            if (prereqNode) {
              await prisma.nodeDependency.create({
                data: {
                  nodeId: currentNode.id,
                  dependsOnId: prereqNode.id,
                },
              });
            }
          }
        }
      }
    }
    
    return { path, nodes: createdNodes }
  },

  async getUserPaths(userId: string, includeShared = true) {
    const where: any = {
      OR: [
        { createdById: userId },
      ],
    }
    if (includeShared) {
      where.OR.push({ isPublic: true });
      // Assuming a many-to-many relation for sharedWith exists as `sharedWithUsers` on LearningPath
      // and `sharedLearningPaths` on User. This part of schema is not fully defined in provided snippets.
      // If it's a direct relation field `sharedWith` on LearningPath storing an array of User IDs:
      // where.OR.push({ sharedWith: { some: { id: userId } } }); 
      // For now, I'll assume the direct relation based on `sharedWith User[] @relation("SharedPaths")`
      // which implies a join table or implicit m-n. If it's an array of IDs, use `hasSome`
       where.OR.push({ sharedWith: { some: { id: userId } } });
    }
    
    const paths = await prisma.learningPath.findMany({
      where,
      include: {
        nodes: {
          orderBy: { order: 'asc' },
        },
        createdBy: { // Assuming relation name from User to LearningPath is 'createdBy'
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            enrolledUsers: true, // Assuming relation name from User to LearningPath for enrollment is 'enrolledUsers'
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
    
    const pathsWithProgress = await Promise.all(
      paths.map(async (path) => {
        const progress = await this.getPathProgress(userId, path.id)
        return { ...path, progress }
      })
    )
    
    return pathsWithProgress
  },

  async getPathDetails(pathId: string, userId: string) {
    const path = await prisma.learningPath.findUnique({
      where: { id: pathId },
      include: {
        nodes: {
          orderBy: { order: 'asc' },
          include: {
            dependencies: {
              include: {
                dependsOn: true,
              },
            },
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        enrolledUsers: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
          take: 5,
        },
        _count: {
          select: {
            enrolledUsers: true,
            nodes: true,
          },
        },
      },
    })
    
    if (!path) {
      throw new Error('Learning path not found')
    }
    
    const hasAccess = 
      path.isPublic ||
      path.createdById === userId ||
      (path.enrolledUsers as {id: string}[]).some(u => u.id === userId) // Corrected type
    
    if (!hasAccess) {
      throw new Error('Access denied')
    }
    
    const progress = await this.getPathProgress(userId, pathId)
    const knowledgeGraph = await this.generateKnowledgeGraph(path as any) // Cast path to any if type is complex
    
    return {
      ...path,
      progress,
      knowledgeGraph,
    }
  },

  async enrollInPath(userId: string, pathId: string) {
    const existing = await prisma.studyProgress.findUnique({
      where: {
        userId_learningPathId: {
          userId,
          learningPathId: pathId,
        },
      },
    })
    
    if (existing) {
      return existing
    }
    
    const path = await prisma.learningPath.findUnique({
      where: { id: pathId },
      include: {
        nodes: true,
      },
    })
    
    if (!path) {
      throw new Error('Learning path not found')
    }
    
    const progress = await prisma.studyProgress.create({
      data: {
        userId,
        learningPathId: pathId,
        totalNodes: path.nodes.length,
        completedNodes: 0,
        progressPercent: 0,
        totalDuration: 0,
        lastStudiedAt: new Date(),
      },
    })
    
    await prisma.learningPath.update({
      where: { id: pathId },
      data: {
        enrolledUsers: {
          connect: { id: userId },
        },
      },
    })
    
    await prisma.learningActivity.create({
      data: {
        userId,
        type: 'PATH_ENROLLED',
        title: '加入学习路径',
        description: `加入了学习路径：${path.title}`,
        metadata: {
          pathId: path.id,
          pathTitle: path.title,
        },
      },
    })
    
    return progress
  },

  async updateNodeProgress(params: UpdateNodeProgressParams) {
    const { userId, pathId, nodeId, completed, timeSpent } = params
    
    const progress = await prisma.userProgress.upsert({
      where: {
        userId_learningNodeId: {
          userId,
          learningNodeId: nodeId,
        },
      },
      update: {
        completed,
        lastAccessedAt: new Date(),
      },
      create: {
        userId,
        learningPathId: pathId,
        learningNodeId: nodeId,
        completed,
        lastAccessedAt: new Date(),
      },
    })
    
    const studyProgress = await prisma.studyProgress.findUnique({
      where: {
        userId_learningPathId: {
          userId,
          learningPathId: pathId,
        },
      },
      include: {
        learningPath: {
          include: {
            nodes: true,
          },
        },
      },
    })
    
    if (studyProgress) {
      const completedCount = await prisma.userProgress.count({
        where: {
          userId,
          learningPathId: pathId,
          completed: true,
        },
      })
      
      const progressPercent = studyProgress.totalNodes > 0 ? (completedCount / studyProgress.totalNodes) * 100 : 0;
      
      await prisma.studyProgress.update({
        where: { id: studyProgress.id },
        data: {
          completedNodes: completedCount,
          progressPercent,
          totalDuration: studyProgress.totalDuration + (timeSpent || 0),
          lastStudiedAt: new Date(),
        },
      })
    }
    
    if (timeSpent && timeSpent > 0) {
      await prisma.learningRecord.create({
        data: {
          userId,
          startTime: new Date(Date.now() - timeSpent * 60 * 1000),
          endTime: new Date(),
          duration: timeSpent,
          contentType: 'PATH_NODE' as any, // Cast to any if ContentType enum doesn't have PATH_NODE
          contentId: nodeId,
          completed,
        },
      })
    }
    
    await cache.del(`path:progress:${userId}:${pathId}`)
    
    return progress
  },

  async getPathProgress(userId: string, pathId: string) {
    const cacheKey = `path:progress:${userId}:${pathId}`
    const cached = await cache.get(cacheKey)
    if (cached) {
      return cached
    }
    
    const studyProgress = await prisma.studyProgress.findUnique({
      where: {
        userId_learningPathId: {
          userId,
          learningPathId: pathId,
        },
      },
    })
    
    if (!studyProgress) {
      // Need to fetch totalNodes for a path a user might not be enrolled in yet
      const pathData = await prisma.learningPath.findUnique({
          where: { id: pathId },
          select: { nodes: { select: { id: true } } }
      });
      return {
        enrolled: false,
        completedNodes: 0,
        totalNodes: pathData?.nodes.length || 0,
        progressPercent: 0,
        totalDuration: 0,
        lastStudiedAt: null,
        nodeProgress: {},
      }
    }
    
    const nodeProgressRecords = await prisma.userProgress.findMany({
      where: {
        userId,
        learningPathId: pathId,
      },
      include: {
        learningNode: true,
      },
    })
    
    const result = {
      enrolled: true,
      ...studyProgress,
      nodeProgress: nodeProgressRecords.reduce((acc, np) => {
        acc[np.learningNodeId] = {
          completed: np.completed,
          lastAccessedAt: np.lastAccessedAt,
        }
        return acc
      }, {} as Record<string, any>),
    }
    
    await cache.set(cacheKey, result, 300) // Cache for 5 minutes
    
    return result
  },

  async generateKnowledgeGraph(path: { nodes: Array<{ id: string; title: string; type: string; duration: number; order: number; dependencies?: Array<{ dependsOnId: string }> }> }) {
    const graphNodes = path.nodes.map((node) => ({
      id: node.id,
      label: node.title,
      type: node.type,
      duration: node.duration,
      order: node.order,
      x: Math.random() * 800 - 400, // Spread nodes for better visualization
      y: Math.random() * 600 - 300,
      z: Math.random() * 400 - 200,
    }))
    
    const edges: Array<{ source: string; target: string; type: string }> = []
    
    for (const node of path.nodes) {
      if (node.dependencies) {
        for (const dep of node.dependencies) {
          edges.push({
            source: dep.dependsOnId,
            target: node.id,
            type: 'prerequisite',
          })
        }
      }
    }
    
    return { nodes: graphNodes, edges }
  },

  calculateTotalDuration(nodes: any[]): number {
    return nodes.reduce((sum, node) => sum + (node.duration || 0), 0)
  },

  calculateOverallDifficulty(nodes: any[]): string {
    const difficulties = nodes.map(n => n.difficulty).filter(Boolean)
    if (difficulties.length === 0) return 'INTERMEDIATE'
    
    const difficultyScores: Record<string, number> = { // Added type for difficultyScores
      BEGINNER: 1,
      INTERMEDIATE: 2,
      ADVANCED: 3,
    }
    
    const avgScore = difficulties.reduce((sum, d) => sum + (difficultyScores[d] || 2), 0) / difficulties.length
    
    if (avgScore <= 1.5) return 'BEGINNER'
    if (avgScore <= 2.5) return 'INTERMEDIATE'
    return 'ADVANCED'
  },
}
