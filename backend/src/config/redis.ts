import Redis from 'ioredis'
import { env } from './env'
import { logger } from '@/utils/logger'

export const redis = new Redis(env.REDIS_URL)

redis.on('connect', () => {
  logger.info('🔴 Redis client connected!')
})

redis.on('error', (err) => {
  logger.error('❌ Redis client error:', err)
})

// Centralized cache utility
export const cache = {
  get: async <T>(key: string): Promise<T | null> => {
    try {
      const data = await redis.get(key)
      return data ? JSON.parse(data) as T : null
    } catch (error) {
      logger.error('Cache get error:', error)
      return null
    }
  },

  set: async <T>(key: string, value: T, ttlSeconds: number = 3600): Promise<boolean> => { // default 1 hour
    try {
      await redis.setex(key, ttlSeconds, JSON.stringify(value))
      return true
    } catch (error) {
      logger.error('Cache set error:', error)
      return false
    }
  },

  del: async (key: string): Promise<boolean> => {
    try {
      await redis.del(key)
      return true
    } catch (error) {
      logger.error('Cache delete error:', error)
      return false
    }
  },
  
  // Invalidate cache by pattern (e.g., all user-related caches)
  invalidatePattern: async (pattern: string) => {
    try {
      const keys = await redis.keys(pattern)
      if (keys.length > 0) {
        await redis.del(...keys)
      }
      return true
    } catch (error) {
      logger.error('Cache invalidate pattern error:', error)
      return false
    }
  }
}
