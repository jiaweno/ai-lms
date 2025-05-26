import * as Sentry from '@sentry/node'
import { nodeProfilingIntegration } from '@sentry/profiling-node'
import { FastifyInstance, FastifyRequest } from 'fastify' 
import { env } from './env' 
import { logger } from '@/utils/logger'
import { redis } from './redis' 
import { prisma } from './database' 

// System performance metrics collection
export class PerformanceMonitor {
  private metrics: Map<string, any> = new Map()
  private intervals: NodeJS.Timeout[] = []

  constructor() {
    if (env.MONITORING_ENABLED) { 
        this.startCollecting()
    }
  }

  private startCollecting() {
    const interval = setInterval(() => {
      this.collectSystemMetrics()
    }, 60000) 
    this.intervals.push(interval)
  }

  private async collectSystemMetrics() {
    try {
      const memUsage = process.memoryUsage()
      const cpuUsage = process.cpuUsage()
      
      const currentMetrics = {
        timestamp: new Date().toISOString(),
        memory: {
          rss: memUsage.rss,
          heapTotal: memUsage.heapTotal,
          heapUsed: memUsage.heapUsed,
          external: memUsage.external,
        },
        cpu: { 
          user: cpuUsage.user / 1000, 
          system: cpuUsage.system / 1000, 
        },
        uptime: process.uptime(),
        pid: process.pid,
      }

      await redis.lpush('system_metrics', JSON.stringify(currentMetrics))
      await redis.ltrim('system_metrics', 0, 1439) 
      this.metrics.set('latest', currentMetrics)
    } catch (error) {
      logger.error('Error collecting system metrics:', error)
    }
  }

  async getMetrics(timeRange = '1h') {
    try {
      let count = 60; 
      if (timeRange === '6h') count = 360;
      else if (timeRange === '24h') count = 1440;

      const rawMetrics = await redis.lrange('system_metrics', 0, count - 1)
      const metricsData = rawMetrics.map(m => JSON.parse(m)).reverse() 

      return {
        timeRange,
        count: metricsData.length,
        data: metricsData,
        summary: this.calculateSummary(metricsData),
      }
    } catch (error) {
      logger.error('Error getting metrics:', error)
      return { timeRange, count: 0, data: [], summary: null }
    }
  }

  private calculateSummary(metricsData: any[]) {
    if (metricsData.length === 0) return null
    const memoryUsage = metricsData.map(m => m.memory.heapUsed)
    return {
      memory: {
        avg: memoryUsage.reduce((sum, mem) => sum + mem, 0) / memoryUsage.length,
        max: Math.max(...memoryUsage),
        min: Math.min(...memoryUsage),
      },
      uptime: metricsData[metricsData.length - 1]?.uptime || 0,
      dataPoints: metricsData.length,
    }
  }

  stop() {
    this.intervals.forEach(clearInterval)
    this.intervals = []
  }
}

export const performanceTrackingMiddleware = async (request: FastifyRequest, reply: any) => { 
  const startTime = Date.now();
  const startUsage = process.cpuUsage();

  reply.addHook('onSend', async (_req: any, _rep: any, payload: any) => {
    const endTime = Date.now();
    const endUsage = process.cpuUsage(startUsage);
    const duration = endTime - startTime;

    const perfData = {
      method: request.method,
      url: request.url,
      statusCode: reply.statusCode,
      duration, 
      cpuUser: endUsage.user / 1000, 
      cpuSystem: endUsage.system / 1000, 
      payloadSize: Buffer.byteLength(payload || ''),
      timestamp: new Date().toISOString(),
      userId: (request.user as any)?.userId, 
    };

    if (duration > 1000) logger.warn('Slow API request detected:', perfData);
    
    if (env.MONITORING_ENABLED) {
        try {
            await redis.lpush('api_performance_logs', JSON.stringify(perfData));
            await redis.ltrim('api_performance_logs', 0, 9999); 
        } catch (error) {
            logger.error('Error storing API performance data:', error);
        }
    }
  });
};


export class UserActivityTracker {
  static async trackActivity(userId: string, action: string, metadata?: any) {
    if (!env.MONITORING_ENABLED) return;
    try {
      const activity = {
        userId,
        action,
        metadata,
        timestamp: new Date().toISOString(),
        ip: metadata?.ip, 
        userAgent: metadata?.userAgent, 
      }
      await redis.lpush(`user_activity:${userId}`, JSON.stringify(activity))
      await redis.expire(`user_activity:${userId}`, 86400 * 30) 
    } catch (error) {
      logger.error('Error tracking user activity:', error)
    }
  }

  static async getUserActivity(userId: string, limit = 100) {
    if (!env.MONITORING_ENABLED) return [];
    try {
      const activities = await redis.lrange(`user_activity:${userId}`, 0, limit - 1)
      return activities.map(a => JSON.parse(a))
    } catch (error) {
      logger.error('Error getting user activity:', error)
      return []
    }
  }
}

export const initializeSentry = (app?: FastifyInstance) => { 
  if (env.SENTRY_DSN && env.MONITORING_ENABLED) {
    Sentry.init({
      dsn: env.SENTRY_DSN,
      environment: env.NODE_ENV,
      integrations: [
        nodeProfilingIntegration(),
        Sentry.httpIntegration(), 
      ],
      tracesSampleRate: env.NODE_ENV === 'production' ? 0.2 : 1.0, 
      profilesSampleRate: env.NODE_ENV === 'production' ? 0.2 : 1.0, 
      release: process.env.APP_VERSION || '1.0.0', 
    });
    logger.info('Sentry monitoring initialized');

    if (app) { 
        app.addHook('onRequest', (request, reply, done) => {
            Sentry.getCurrentScope().setTag('route', request.routerPath || request.url);
            Sentry.getCurrentScope().setContext('request', {
              method: request.method,
              url: request.url,
              headers: request.headers,
              query: request.query,
            });
            done();
        });

        app.setErrorHandler(async (error, request, reply) => {
            Sentry.captureException(error, (scope) => {
              scope.setTag('route', request.routerPath || request.url);
              scope.setTag('method', request.method);
              scope.setContext('request_body', request.body || {});
              scope.setUser({ id: (request.user as any)?.userId, email: (request.user as any)?.email });
              return scope;
            });
            logger.error("Global error handler (Sentry integrated):", error);
            reply.status(error.statusCode || 500).send({
                success: false,
                error: error.name || "Internal Server Error",
                message: error.message
            });
        });
    }
  } else {
    logger.info('Sentry DSN not provided or monitoring disabled. Sentry not initialized.');
  }
};

export const initializeMonitoringServices = (app: FastifyInstance) => {
  initializeSentry(app); 
  
  if (env.MONITORING_ENABLED) {
    const perfMonitor = new PerformanceMonitor();
    (app as any).performanceMonitor = perfMonitor; 
    
    app.addHook('preHandler', performanceTrackingMiddleware);

    logger.info('Performance and User Activity Monitoring services initialized.');
    return perfMonitor; 
  }
  return null;
};

export async function checkDatabaseHealth() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'connected' };
  } catch (error: any) {
    return { status: 'disconnected', error: error.message };
  }
}

export async function checkRedisHealth() {
  try {
    await redis.ping();
    return { status: 'connected' };
  } catch (error: any) {
    return { status: 'disconnected', error: error.message };
  }
}

// Zod schema for env vars related to monitoring. This should be part of the main env.ts schema.
// const monitoringEnvSchema = z.object({
//   SENTRY_DSN: z.string().optional(),
//   MONITORING_ENABLED: z.preprocess((val) => val === 'true', z.boolean().default(true)),
// });
// Ensure these fields are added to the main envSchema in backend/src/config/env.ts
// For example:
// SENTRY_DSN: z.string().optional(),
// MONITORING_ENABLED: z.preprocess((val) => val === 'true', z.boolean().default(true)).optional(),
// Make sure to update the main env.ts with these if they are not already there.
