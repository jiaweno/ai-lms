import OpenAI from 'openai'
import { env } from './env'
import { logger } from '@/utils/logger'

// OpenAI client
let openaiClient: OpenAI | null = null

if (env.AI_PROVIDER === 'openai' && env.OPENAI_API_KEY) {
  openaiClient = new OpenAI({
    apiKey: env.OPENAI_API_KEY,
  })
}

// Ollama client configuration
const ollamaConfig = {
  baseURL: env.OLLAMA_BASE_URL,
  model: env.OLLAMA_MODEL,
}

// AI Service abstraction
export const aiService = {
  async generateCompletion(prompt: string, options?: {
    maxTokens?: number
    temperature?: number
    stream?: boolean
  }) {
    if (env.AI_PROVIDER === 'openai' && openaiClient) {
      try {
        const response = await openaiClient.chat.completions.create({
          model: env.OPENAI_MODEL,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: options?.maxTokens || env.OPENAI_MAX_TOKENS,
          temperature: options?.temperature || 0.7,
          stream: options?.stream || false,
        })
        
        if (options?.stream) {
          return response
        }
        
        return response.choices[0]?.message?.content || ''
      } catch (error) {
        logger.error('OpenAI API error:', error)
        throw error
      }
    } else if (env.AI_PROVIDER === 'ollama') {
      // Ollama implementation
      try {
        const response = await fetch(`${ollamaConfig.baseURL}/api/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: ollamaConfig.model,
            prompt,
            stream: options?.stream || false,
            options: {
              num_predict: options?.maxTokens || 1000,
              temperature: options?.temperature || 0.7,
            },
          }),
        })
        
        if (options?.stream) {
          return response.body
        }
        
        const data = await response.json()
        return data.response
      } catch (error) {
        logger.error('Ollama API error:', error)
        throw error
      }
    }
    
    throw new Error('AI provider not configured')
  },

  async embedText(text: string): Promise<number[]> {
    if (env.AI_PROVIDER === 'openai' && openaiClient) {
      const response = await openaiClient.embeddings.create({
        model: 'text-embedding-ada-002',
        input: text,
      })
      return response.data[0].embedding
    }
    
    // For Ollama, return mock embeddings or implement actual embedding
    return Array(1536).fill(0).map(() => Math.random())
  },
}

// AI Usage tracking
export const aiUsageTracker = {
  async trackUsage(userId: string, tokens: number, cost: number) {
    // Implementation would track usage in database
    logger.info(`AI usage tracked: User ${userId}, Tokens: ${tokens}, Cost: $${cost}`)
  },
  
  async checkLimit(userId: string): Promise<boolean> {
    // Check if user has exceeded monthly limit
    return true // Simplified for now
  },
}
