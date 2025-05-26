import { prisma } from '@/config/database'
import { logger } from '@/utils/logger'

export const tagService = {
  async getAllTags(type: 'file' | 'question' | 'general' = 'general') {
    // In a more complex system, tags might be namespaced by type
    return prisma.fileTag.findMany({
      orderBy: { name: 'asc' },
    })
  },

  async findOrCreateTags(tagNames: string[]) {
    const tags = []
    for (const name of tagNames) {
      const tagName = name.trim()
      if (tagName) {
        const tag = await prisma.fileTag.upsert({
          where: { name: tagName },
          update: {},
          create: { name: tagName },
        })
        tags.push(tag)
      }
    }
    return tags
  },

  async getPopularTags(limit = 10) {
    // This is a simplified version. A real implementation might involve
    // counting tag usage across different models (FileUploads, Questions, etc.)
    // For FileTag specifically:
    const popularFileTags = await prisma.fileTag.findMany({
      include: {
        _count: {
          select: { files: true },
        },
      },
      orderBy: {
        files: { _count: 'desc' },
      },
      take: limit,
    })
    return popularFileTags.map(tag => ({
      id: tag.id,
      name: tag.name,
      count: tag._count.files,
    }))
  },

  async deleteTag(tagId: string) {
    // Consider implications: what happens to items associated with this tag?
    // Here, we'll just delete the tag. Associated items will lose this tag.
    try {
      await prisma.fileTag.delete({
        where: { id: tagId },
      })
      logger.info(`Tag deleted: ${tagId}`)
      return true
    } catch (error) {
      logger.error(`Error deleting tag ${tagId}:`, error)
      // Prisma throws P2025 if record to delete does not exist.
      if ((error as any).code === 'P2025') {
        return false 
      }
      throw error
    }
  },

  async renameTag(tagId: string, newName: string) {
    const trimmedNewName = newName.trim()
    if (!trimmedNewName) {
      throw new Error("New tag name cannot be empty.")
    }
    // Check if newName already exists
    const existingTag = await prisma.fileTag.findUnique({
      where: { name: trimmedNewName },
    })
    if (existingTag && existingTag.id !== tagId) {
      throw new Error(`Tag "${trimmedNewName}" already exists.`)
    }

    try {
      const updatedTag = await prisma.fileTag.update({
        where: { id: tagId },
        data: { name: trimmedNewName },
      })
      logger.info(`Tag renamed: ${tagId} to ${trimmedNewName}`)
      return updatedTag
    } catch (error) {
      logger.error(`Error renaming tag ${tagId}:`, error)
      if ((error as any).code === 'P2025') {
        throw new Error("Tag to rename not found.")
      }
      throw error
    }
  }
}
