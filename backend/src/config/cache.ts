import { Redis } from 'ioredis'
import { env } from './env'
import { logger } from '@/utils/logger'

// 多层缓存配置
export const cacheConfig = {
  // L1: 内存缓存 (最快，容量小)
  memory: {
    maxSize: 1000,
    ttl: 300, // 5分钟
  },
  // L2: Redis缓存 (快速，容量大)
  redis: {
    defaultTTL: 3600, // 1小时
    longTTL: 86400, // 24小时
    shortTTL: 300, // 5分钟
  },
  // L3: 数据库 (最慢，持久化) // This is a conceptual layer, not directly implemented in CacheManager
}

// 内存缓存实现
class MemoryCache {
  private cache = new Map<string, { value: any; expires: number }>()
  private maxSize: number

  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize
  }

  set(key: string, value: any, ttl: number = 300): void {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value
      if (firstKey) { 
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      value,
      expires: Date.now() + ttl * 1000,
    })
  }

  get(key: string): any | null {
    const item = this.cache.get(key)
    if (!item) return null

    if (Date.now() > item.expires) {
      this.cache.delete(key)
      return null
    }
    return item.value
  }

  del(key: string): void {
    this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  size(): number {
    return this.cache.size
  }
}

// 缓存管理器
export class CacheManager {
  private memoryCache: MemoryCache
  private redis: Redis // This will be the ioredis instance

  constructor(redisInstance: Redis) { 
    this.memoryCache = new MemoryCache(cacheConfig.memory.maxSize)
    this.redis = redisInstance;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const memResult = this.memoryCache.get(key)
      if (memResult !== null) {
        logger.debug(`Cache hit (memory): ${key}`)
        return memResult as T; // Added type assertion
      }

      const redisResult = await this.redis.get(key)
      if (redisResult) {
        const parsed = JSON.parse(redisResult) as T; // Added type assertion
        this.memoryCache.set(key, parsed, cacheConfig.memory.ttl)
        logger.debug(`Cache hit (redis): ${key}`)
        return parsed
      }

      logger.debug(`Cache miss: ${key}`)
      return null
    } catch (error) {
      logger.error(`Cache get error for key ${key}:`, error)
      return null
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      const redisTTL = ttl || cacheConfig.redis.defaultTTL
      const memoryTTL = Math.min(redisTTL, cacheConfig.memory.ttl)

      await this.redis.setex(key, redisTTL, JSON.stringify(value))
      this.memoryCache.set(key, value, memoryTTL)
      logger.debug(`Cache set: ${key} (TTL: ${redisTTL}s)`)
    } catch (error) {
      logger.error(`Cache set error for key ${key}:`, error)
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.redis.del(key)
      this.memoryCache.del(key)
      logger.debug(`Cache deleted: ${key}`)
    } catch (error) {
      logger.error(`Cache delete error for key ${key}:`, error)
    }
  }

  async invalidatePattern(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(pattern)
      if (keys.length > 0) {
        await this.redis.del(...keys)
        keys.forEach(key => this.memoryCache.del(key)); 
      }
      logger.debug(`Cache pattern invalidated: ${pattern} (${keys.length} keys)`)
    } catch (error) {
      logger.error(`Cache invalidate pattern error for ${pattern}:`, error)
    }
  }

  async warmup(data: Array<{ key: string; value: any; ttl?: number }>): Promise<void> {
    logger.info('Starting cache warmup...')
    const promises = data.map(({ key, value, ttl }) => this.set(key, value, ttl))
    await Promise.all(promises)
    logger.info(`Cache warmup completed: ${data.length} items`)
  }

  getStats() {
    return {
      memory: {
        size: this.memoryCache.size(),
        maxSize: cacheConfig.memory.maxSize,
      },
      redis: {
        connected: this.redis.status === 'ready',
      },
    }
  }
}

// The 'cache' object in 'config/redis.ts' should be replaced by an instance of this CacheManager.
// This file defines the manager, and redis.ts should instantiate it.
// For now, just exporting createCacheManager.
export const createCacheManager = (redisInstance: Redis) => new CacheManager(redisInstance);
