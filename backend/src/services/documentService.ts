import pdfParse from 'pdf-parse'
import mammoth from 'mammoth'
import { logger } from '@/utils/logger'
import { fileOperations } from '@/config/minio'
import { prisma } from '@/config/database'

interface ParsedDocument {
  title: string
  content: string
  sections: DocumentSection[]
  metadata: Record<string, any>
}

interface DocumentSection {
  title: string
  content: string
  level: number
  startIndex: number
  endIndex: number
}

export const documentService = {
  async parseDocument(fileId: string): Promise<ParsedDocument> {
    const file = await prisma.fileUpload.findUnique({
      where: { id: fileId },
    })
    
    if (!file) {
      throw new Error('File not found')
    }
    
    const stream = await fileOperations.getFileStream(file.objectName)
    const buffer = await streamToBuffer(stream)
    
    switch (file.mimetype) {
      case 'application/pdf':
        return await this.parsePDF(buffer, file.originalName)
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        return await this.parseWord(buffer, file.originalName)
      case 'text/plain':
        return await this.parseText(buffer.toString('utf-8'), file.originalName)
      default:
        throw new Error(`Unsupported file type: ${file.mimetype}`)
    }
  },

  async parsePDF(buffer: Buffer, filename: string): Promise<ParsedDocument> {
    try {
      const data = await pdfParse(buffer)
      const content = data.text
      const sections = this.extractSections(content)
      
      return {
        title: filename.replace('.pdf', ''),
        content,
        sections,
        metadata: {
          pages: data.numpages,
          info: data.info,
        },
      }
    } catch (error) {
      logger.error('PDF parsing error:', error)
      throw new Error('Failed to parse PDF')
    }
  },

  async parseWord(buffer: Buffer, filename: string): Promise<ParsedDocument> {
    try {
      const result = await mammoth.extractRawText({ buffer })
      const content = result.value
      const sections = this.extractSections(content)
      
      return {
        title: filename.replace('.docx', ''),
        content,
        sections,
        metadata: {
          messages: result.messages,
        },
      }
    } catch (error) {
      logger.error('Word parsing error:', error)
      throw new Error('Failed to parse Word document')
    }
  },

  async parseText(content: string, filename: string): Promise<ParsedDocument> {
    const sections = this.extractSections(content)
    
    return {
      title: filename.replace('.txt', ''),
      content,
      sections,
      metadata: {},
    }
  },

  extractSections(content: string): DocumentSection[] {
    const sections: DocumentSection[] = []
    const lines = content.split('\n')
    
    // Simple section extraction based on patterns
    const sectionPatterns = [
      /^第[一二三四五六七八九十\d]+[章节部分]/,
      /^Chapter\s+\d+/i,
      /^\d+\.\s+/,
      /^[一二三四五六七八九十]+、/,
    ]
    
    let currentSection: DocumentSection | null = null
    let currentContent: string[] = []
    let startIndex = 0
    
    lines.forEach((line, index) => {
      const isSection = sectionPatterns.some(pattern => pattern.test(line.trim()))
      
      if (isSection && line.trim().length > 0) {
        // Save previous section
        if (currentSection) {
          currentSection.content = currentContent.join('\n')
          currentSection.endIndex = startIndex + currentSection.content.length
          sections.push(currentSection)
        }
        
        // Start new section
        startIndex = content.indexOf(line, startIndex)
        currentSection = {
          title: line.trim(),
          content: '',
          level: this.detectSectionLevel(line),
          startIndex,
          endIndex: 0,
        }
        currentContent = []
      } else if (currentSection) {
        currentContent.push(line)
      }
    })
    
    // Save last section
    if (currentSection) {
      currentSection.content = currentContent.join('\n')
      currentSection.endIndex = content.length
      sections.push(currentSection)
    }
    
    // If no sections found, treat entire content as one section
    if (sections.length === 0) {
      sections.push({
        title: 'Content',
        content: content,
        level: 1,
        startIndex: 0,
        endIndex: content.length,
      })
    }
    
    return sections
  },

  detectSectionLevel(title: string): number {
    if (/^第[一二三四五六七八九十\d]+章/.test(title) || /^Chapter\s+\d+/i.test(title)) {
      return 1
    } else if (/^第[一二三四五六七八九十\d]+节/.test(title) || /^\d+\.\d+/.test(title)) {
      return 2
    } else if (/^[一二三四五六七八九十]+、/.test(title)) {
      return 3
    }
    return 2
  },

  async preprocessForAI(document: ParsedDocument): Promise<string[]> {
    // Split content into chunks suitable for AI processing
    const chunks: string[] = []
    const maxChunkSize = 2000 // characters
    
    for (const section of document.sections) {
      if (section.content.length <= maxChunkSize) {
        chunks.push(`[${section.title}]\n${section.content}`)
      } else {
        // Split large sections
        const words = section.content.split(/\s+/)
        let currentChunk = `[${section.title}]\n`
        
        for (const word of words) {
          if ((currentChunk + word).length > maxChunkSize) {
            chunks.push(currentChunk.trim())
            currentChunk = `[${section.title} - 续]\n`
          }
          currentChunk += word + ' '
        }
        
        if (currentChunk.trim()) {
          chunks.push(currentChunk.trim())
        }
      }
    }
    
    return chunks
  },
}

async function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  const chunks: Buffer[] = []
  for await (const chunk of stream) {
    chunks.push(chunk)
  }
  return Buffer.concat(chunks)
}
