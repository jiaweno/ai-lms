DAY1 源码整合

JSON

// backend/package.json
{
  "name": "ai-lms-backend",
  "version": "1.0.0",
  "description": "AI Learning Management System Backend",
  "main": "dist/server.js",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "lint": "eslint src --ext .ts",
    "lint:fix": "eslint src --ext .ts --fix",
    "format": "prettier --write \"src/**/*.ts\"",
    "type-check": "tsc --noEmit",
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:seed": "tsx src/prisma/seed.ts",
    "db:studio": "prisma studio",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  },
  "keywords": [
    "ai",
    "learning",
    "management",
    "system",
    "fastify",
    "typescript"
  ],
  "author": "AI LMS Team",
  "license": "MIT",
  "dependencies": {
    "@fastify/cors": "^8.2.1",
    "@fastify/helmet": "^10.1.0",
    "@fastify/jwt": "^6.7.1",
    "@fastify/multipart": "^7.6.0",
    "@fastify/rate-limit": "^8.0.0",
    "@fastify/swagger": "^8.3.1",
    "@fastify/swagger-ui": "^1.8.0",
    "@prisma/client": "^4.12.0",
    "bcrypt": "^5.1.0",
    "fastify": "^4.17.0",
    "ioredis": "^5.3.1",
    "joi": "^17.9.1",
    "multer": "^1.4.5-lts.1",
    "openai": "^3.2.1",
    "pino": "^8.11.0",
    "pino-pretty": "^10.0.0",
    "uuid": "^9.0.0"
  },
  "devDependencies": {
    "@swc-node/register": "^1.6.5",
    "@swc/core": "^1.3.50",
    "@types/bcrypt": "^5.0.0",
    "@types/jest": "^29.5.0",
    "@types/joi": "^17.2.3",
    "@types/multer": "^1.4.7",
    "@types/node": "^18.15.11",
    "@types/supertest": "^2.0.12",
    "@types/uuid": "^9.0.1",
    "@typescript-eslint/eslint-plugin": "^5.59.0",
    "@typescript-eslint/parser": "^5.59.0",
    "eslint": "^8.38.0",
    "eslint-config-prettier": "^8.8.0",
    "eslint-plugin-prettier": "^4.2.1",
    "jest": "^29.5.0",
    "prettier": "^2.8.7",
    "prisma": "^4.12.0",
    "supertest": "^6.3.3",
    "ts-jest": "^29.1.0",
    "tsx": "^3.12.6",
    "typescript": "^5.0.4",
    "winston": "^3.8.2"
  }
}
JSON

// backend/tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020"],
    "module": "commonjs",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": false,
    "declaration": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "baseUrl": "./src",
    "paths": {
      "@/*": ["./*"],
      "@/config/*": ["./config/*"],
      "@/routes/*": ["./routes/*"],
      "@/middlewares/*": ["./middlewares/*"],
      "@/services/*": ["./services/*"],
      "@/utils/*": ["./utils/*"],
      "@/types/*": ["./types/*"]
    },
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "strictPropertyInitialization": false,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noImplicitThis": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "exactOptionalPropertyTypes": false
  },
  "include": [
    "src/**/*"
  ],
  "exclude": [
    "node_modules",
    "dist",
    "**/*.test.ts",
    "**/*.spec.ts"
  ]
}
TypeScript

// backend/src/server.ts
import { app } from './app'
import { env } from '@/config/env'
import { logger } from '@/utils/logger'

const start = async () => {
  try {
    await app.listen({
      port: env.PORT,
      host: env.HOST
    })
    
    logger.info(`🚀 Server running on http://${env.HOST}:${env.PORT}`)
    logger.info(`📚 API Documentation: http://${env.HOST}:${env.PORT}/docs`)
    logger.info(`🔍 Environment: ${env.NODE_ENV}`)
  } catch (err) {
    logger.error('❌ Error starting server:', err)
    process.exit(1)
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...')
  await app.close()
  process.exit(0)
})

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully...')
  await app.close()
  process.exit(0)
})

start()
TypeScript

// backend/src/app.ts
import Fastify from 'fastify'
import { env } from '@/config/env'
import { logger } from '@/utils/logger'
import { setupPlugins } from '@/config/plugins'
import { setupRoutes } from '@/routes'
import { errorHandler } from '@/middlewares/error'
import { prisma } from '@/config/database'
import { redis } from '@/config/redis'

// Create Fastify instance
export const app = Fastify({
  logger: env.NODE_ENV === 'development' ? {
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    },
  } : true, // Use default logger for production
})

// Register plugins
setupPlugins(app)

// Register routes
setupRoutes(app)

// Register error handler
app.setErrorHandler(errorHandler)

// Hook to close Prisma and Redis connections on shutdown
app.addHook('onClose', async (instance) => {
  logger.info('Shutting down: Closing database and Redis connections...')
  await prisma.$disconnect()
  await redis.quit()
  logger.info('Database and Redis connections closed.')
})
TypeScript

// backend/src/config/env.ts
import dotenv from 'dotenv'
import path from 'path'
import { z } from 'zod'

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

// Define schema for environment variables
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.preprocess(Number, z.number().default(3000)),
  HOST: z.string().default('0.0.0.0'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  REDIS_URL: z.string().min(1, 'REDIS_URL is required'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  UPLOAD_PATH: z.string().default('./uploads'),
  MAX_FILE_SIZE: z.preprocess(Number, z.number().default(50 * 1024 * 1024)), // 50MB
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default('gpt-3.5-turbo'),
  OPENAI_MAX_TOKENS: z.preprocess(Number, z.number().default(1000)),
  RATE_LIMIT_MAX: z.preprocess(Number, z.number().default(100)), // Max requests per window
  RATE_LIMIT_WINDOW: z.string().default('1 minute'), // Time window for rate limiting
})

// Parse and validate environment variables
const parsedEnv = envSchema.safeParse(process.env)

if (!parsedEnv.success) {
  console.error('❌ Invalid environment variables:', parsedEnv.error.format())
  throw new Error('Invalid environment variables')
}

export const env = parsedEnv.data
TypeScript

// backend/src/config/database.ts
import { PrismaClient } from '@prisma/client'
import { logger } from '@/utils/logger'

export const prisma = new PrismaClient({
  log: [
    { level: 'query', emit: 'event' },
    { level: 'error', emit: 'event' },
    { level: 'info', emit: 'event' },
    { level: 'warn', emit: 'event' },
  ],
})

// Log Prisma queries (optional, for debugging)
prisma.$on('query', (e) => {
  if (process.env.NODE_ENV === 'development') {
    logger.debug(`Prisma Query: ${e.query} Params: ${e.params} Duration: ${e.duration}ms`)
  }
})

prisma.$on('error', (e) => {
  logger.error(`Prisma Error: ${e.message}`)
})

prisma.$on('info', (e) => {
  logger.info(`Prisma Info: ${e.message}`)
})

prisma.$on('warn', (e) => {
  logger.warn(`Prisma Warn: ${e.message}`)
})

// Connect to database on startup
export const connectDb = async () => {
  try {
    await prisma.$connect()
    logger.info('📦 Connected to PostgreSQL database.')
  } catch (error) {
    logger.error('❌ Failed to connect to database:', error)
    process.exit(1)
  }
}

connectDb()
TypeScript

// backend/src/config/redis.ts
import { Redis } from 'ioredis'
import { env } from '@/config/env'
import { logger } from '@/utils/logger'

export const redis = new Redis(env.REDIS_URL)

redis.on('connect', () => {
  logger.info('🚀 Connected to Redis.')
})

redis.on('error', (err) => {
  logger.error('❌ Redis connection error:', err)
})

// Basic cache utility
export const cache = {
  get: async <T>(key: string): Promise<T | null> => {
    try {
      const data = await redis.get(key)
      return data ? JSON.parse(data) : null
    } catch (error) {
      logger.error('Cache get error:', error)
      return null
    }
  },
  
  set: async (key: string, value: any, ttlSeconds: number = 3600): Promise<boolean> => {
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
TypeScript

// backend/src/utils/logger.ts
import winston from 'winston'
import { env } from '@/config/env'

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
)

export const logger = winston.createLogger({
  level: env.NODE_ENV === 'development' ? 'debug' : 'info',
  format: logFormat,
  defaultMeta: { service: 'ai-lms-backend' },
  transports: [
    new winston.transports.Console({
      format: env.NODE_ENV === 'development' 
        ? winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        : logFormat
    }),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ],
})
代码段

// backend/src/config/plugins.ts
import { FastifyInstance } from 'fastify'
import { env } from './env'

export const setupPlugins = async (app: FastifyInstance) => {
  // CORS
  await app.register(import('@fastify/cors'), {
    origin: env.CORS_ORIGIN.split(','),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  })

  // Security headers
  await app.register(import('@fastify/helmet'), {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  })

  // Rate limiting
  await app.register(import('@fastify/rate-limit'), {
    max: env.RATE_LIMIT_MAX,
    timeWindow: env.RATE_LIMIT_WINDOW,
  })

  // JWT
  await app.register(import('@fastify/jwt'), {
    secret: env.JWT_SECRET,
    sign: {
      expiresIn: env.JWT_EXPIRES_IN,
    },
  })

  // Multipart/form-data support (for file uploads)
  await app.register(import('@fastify/multipart'), {
    limits: {
      fieldNameSize: 100,
      fieldSize: 100,
      fields: 10,
      fileSize: env.MAX_FILE_SIZE, // 50MB
      files: 1,
      headerPairs: 2000,
    },
  })

  // Swagger (API documentation)
  await app.register(import('@fastify/swagger'), {
    routePrefix: '/docs',
    swagger: {
      info: {
        title: 'AI Learning Management System API',
        description: 'API documentation for the AI Learning Management System',
        version: '1.0.0',
      },
      externalDocs: {
        url: 'https://swagger.io',
        description: 'Find more info here',
      },
      host: `localhost:${env.PORT}`,
      schemes: ['http'],
      consumes: ['application/json', 'multipart/form-data'],
      produces: ['application/json'],
      securityDefinitions: {
        Bearer: {
          type: 'apiKey',
          name: 'Authorization',
          in: 'header',
          description: 'Bearer Token (e.g., "Bearer YOUR_TOKEN")',
        },
      },
    },
  })

  await app.register(import('@fastify/swagger-ui'), {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list', // or 'full' or 'none'
      filter: true,
      operationsSorter: 'alpha',
      tagsSorter: 'alpha',
    },
  })
}
TypeScript

// backend/src/middlewares/error.ts
import { FastifyError, FastifyReply, FastifyRequest } from 'fastify'
import { logger } from '@/utils/logger'
import { ZodError } from 'zod'

export const errorHandler = (
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
) => {
  if (error instanceof ZodError) {
    // Zod validation error
    return reply.code(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Validation failed',
      details: error.errors,
    })
  }

  // Log the error for internal debugging
  logger.error(`Error processing request: ${error.message}`, {
    method: request.method,
    url: request.url,
    ip: request.ip,
    stack: error.stack,
  })

  // Send a generic error response to the client
  const statusCode = error.statusCode || 500
  const message = statusCode === 500 ? 'Internal Server Error' : error.message
  const errorName = error.name || 'ServerError'

  reply.code(statusCode).send({
    statusCode,
    error: errorName,
    message,
  })
}
TypeScript

// backend/src/middlewares/auth.ts
import { FastifyRequest, FastifyReply } from 'fastify'
import { logger } from '@/utils/logger'
import { prisma } from '@/config/database'
import { FastifyJWT } from '@fastify/jwt'

// Extend FastifyRequest with user information
declare module 'fastify' {
  interface FastifyRequest {
    user: FastifyJWT['user']
  }
}

// Extend FastifyJWT with custom payload types
declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: {
      userId: string
      email: string
      role: string
    }
    user: {
      userId: string
      email: string
      role: string
    }
  }
}

export const authenticate = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    // Verify JWT token from Authorization header
    await request.jwtVerify()

    // Optionally, check if user exists in DB and is active
    const user = await prisma.user.findUnique({
      where: { id: request.user.userId },
      select: { isActive: true },
    })

    if (!user || !user.isActive) {
      logger.warn(`Attempted access by inactive/non-existent user: ${request.user.userId}`)
      return reply.code(401).send({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid or inactive user',
      })
    }
  } catch (err: any) {
    logger.warn(`Authentication failed: ${err.message}`)
    return reply.code(401).send({
      success: false,
      error: 'Unauthorized',
      message: err.message || 'Invalid Token',
    })
  }
}

export const authorize = (requiredRoles: string[]) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    // Ensure authenticate middleware runs first
    if (!request.user || !request.user.role) {
      logger.error('Authorize middleware called before authentication.')
      return reply.code(500).send({
        success: false,
        error: 'ServerError',
        message: 'Authentication context missing for authorization.',
      })
    }

    const userRole = request.user.role.toUpperCase()

    if (!requiredRoles.includes(userRole)) {
      logger.warn(
        `User ${request.user.email} (Role: ${userRole}) attempted unauthorized access to route requiring roles: ${requiredRoles.join(
          ', '
        )}`
      )
      return reply.code(403).send({
        success: false,
        error: 'Forbidden',
        message: 'You do not have permission to perform this action.',
      })
    }
  }
}
TypeScript

// backend/src/middlewares/validation.ts
import { FastifyRequest, FastifyReply } from 'fastify'
import { z, ZodSchema } from 'zod'

export const validateBody = (schema: ZodSchema) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      request.body = schema.parse(request.body)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          error: 'Validation Error',
          message: 'Invalid request body',
          details: error.errors,
        })
      }
      throw error
    }
  }
}

export const validateQuery = (schema: ZodSchema) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      request.query = schema.parse(request.query)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          error: 'Validation Error',
          message: 'Invalid query parameters',
          details: error.errors,
        })
      }
      throw error
    }
  }
}

export const validateParams = (schema: ZodSchema) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      request.params = schema.parse(request.params)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          error: 'Validation Error',
          message: 'Invalid path parameters',
          details: error.errors,
        })
      }
      throw error
    }
  }
}
TypeScript

// backend/src/routes/index.ts
import { FastifyInstance } from 'fastify'
import { healthRoutes } from './health'
import { authRoutes } from './auth'

export const setupRoutes = async (app: FastifyInstance) => {
  // Register all routes with /api prefix
  await app.register(async function (fastify) {
    await fastify.register(healthRoutes)
    await fastify.register(authRoutes, { prefix: '/auth' })
    // More routes will be added here
  }, { prefix: '/api' })
}
TypeScript

// backend/src/routes/health.ts
import { FastifyInstance } from 'fastify'
import { prisma } from '@/config/database'
import { redis } from '@/config/redis'

export const healthRoutes = async (app: FastifyInstance) => {
  // Basic health check
  app.get('/health', {
    schema: {
      description: 'Health check endpoint',
      tags: ['Health'],
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            timestamp: { type: 'string' },
            uptime: { type: 'number' },
            services: {
              type: 'object',
              properties: {
                database: { type: 'string' },
                redis: { type: 'string' },
              },
            },
          },
        },
      },
    },
  }, async (request, reply) => {
    try {
      // Check database connection
      await prisma.$queryRaw`SELECT 1`
      
      // Check Redis connection
      await redis.ping()
      
      reply.send({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        services: {
          database: 'ok',
          redis: 'ok',
        },
      })
    } catch (error: any) {
      reply.code(500).send({
        status: 'error',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        services: {
          database: error.message.includes('timeout') ? 'timeout' : 'error',
          redis: error.message.includes('timeout') ? 'timeout' : 'error',
        },
        message: 'One or more services are unhealthy.',
        details: error.message,
      })
    }
  })
}
TypeScript

// backend/src/routes/auth.ts
import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import bcrypt from 'bcrypt'
import { prisma } from '@/config/database'
import { validateBody } from '@/middlewares/validation'
import { authenticate } from '@/middlewares/auth'
import { logger } from '@/utils/logger'

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1, 'Name is required').max(50, 'Name too long'),
  role: z.enum(['STUDENT', 'TEACHER', 'ADMIN']).optional().default('STUDENT'),
})

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
})

// Auth routes
export const authRoutes = async (app: FastifyInstance) => {
  // Register new user
  app.post('/register', {
    preHandler: validateBody(registerSchema),
    schema: {
      description: 'Register a new user',
      tags: ['Authentication'],
      body: {
        type: 'object',
        required: ['email', 'password', 'name'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 6 },
          name: { type: 'string', minLength: 1, maxLength: 50 },
          role: { type: 'string', enum: ['STUDENT', 'TEACHER', 'ADMIN'], default: 'STUDENT' },
        },
      },
      response: {
        201: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                name: { type: 'string' },
                role: { type: 'string' },
              },
            },
          },
        },
        409: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' },
            message: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    const { email, password, name, role } = request.body as z.infer<typeof registerSchema>

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return reply.code(409).send({
        success: false,
        error: 'Conflict',
        message: 'User with this email already exists.',
      })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    })

    reply.code(201).send({
      success: true,
      message: 'User registered successfully',
      user,
    })
  })

  // User login
  app.post('/login', {
    preHandler: validateBody(loginSchema),
    schema: {
      description: 'Login user and get JWT token',
      tags: ['Authentication'],
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            token: { type: 'string' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                name: { type: 'string' },
                role: { type: 'string' },
              },
            },
          },
        },
        401: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' },
            message: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    const { email, password } = request.body as z.infer<typeof loginSchema>

    // Find user by email
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !user.isActive) {
      return reply.code(401).send({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid credentials or inactive account.',
      })
    }

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      return reply.code(401).send({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid credentials.',
      })
    }

    // Generate JWT token
    const token = app.jwt.sign({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    // Store session (optional, for revocation/multi-device management)
    await prisma.session.create({
      data: {
        userId: user.id,
        token: token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    })

    reply.send({
      success: true,
      message: 'Logged in successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    })
  })

  // Get user profile
  app.get('/profile', {
    preHandler: authenticate, // Protect this route
    schema: {
      description: 'Get user profile',
      tags: ['Authentication'],
      security: [{ Bearer: [] }], // Indicate JWT security
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                name: { type: 'string' },
                role: { type: 'string' },
                avatar: { type: 'string' },
                createdAt: { type: 'string' },
              },
            },
          },
        },
      },
    },
  }, async (request, reply) => {
    const user = await prisma.user.findUnique({
      where: { id: request.user.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        createdAt: true,
      },
    })

    if (!user) {
      return reply.code(404).send({
        success: false,
        error: 'User not found',
        message: 'User profile not found',
      })
    }

    reply.send({
      success: true,
      data: user,
    })
  })

  // Logout
  app.post('/logout', {
    preHandler: authenticate,
    schema: {
      description: 'Logout user',
      tags: ['Authentication'],
      security: [{ Bearer: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    // Get token from header
    const authHeader = request.headers.authorization
    const token = authHeader?.replace('Bearer ', '')

    if (token) {
      // Delete session
      await prisma.session.deleteMany({
        where: {
          userId: request.user.userId,
          token: token,
        },
      })
      logger.info(`User ${request.user.email} logged out.`)
    } else {
      logger.warn(`Logout attempt without token for user ${request.user.email}.`)
    }

    reply.send({ success: true, message: 'Logged out successfully' })
  })
}
TypeScript

// backend/src/prisma/schema.prisma
// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String
  password  String
  role      Role     @default(STUDENT)
  avatar    String?
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  sessions      Session[]
  fileUploads   FileUpload[]
  learningPaths LearningPath[]
  examRecords   ExamRecord[]
  answers       Answer[]
  userStats     UserStats?

  @@map("users")
}

model Session {
  id        String   @id @default(uuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())

  // Relations
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("sessions")
}

model FileUpload {
  id           String    @id @default(uuid())
  filename     String
  originalName String
  mimetype     String
  size         Int
  url          String
  category     String?
  userId       String
  isProcessed  Boolean   @default(false)
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  // Relations
  user         User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  learningNodes LearningNode[] // Files can be part of learning nodes

  @@map("file_uploads")
}

model LearningPath {
  id          String         @id @default(uuid())
  title       String
  description String?
  userId      String // Owner of the learning path (could be teacher/admin)
  isPublic    Boolean        @default(false)
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt

  // Relations
  user        User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  nodes       LearningNode[]
  userProgress UserProgress[]

  @@map("learning_paths")
}

model LearningNode {
  id            String             @id @default(uuid())
  title         String
  description   String?
  type          LearningNodeType
  content       String? // Markdown or HTML content
  fileUploadId  String?
  learningPathId String
  order         Int
  createdAt     DateTime           @default(now())
  updatedAt     DateTime           @updatedAt

  // Relations
  learningPath  LearningPath       @relation(fields: [learningPathId], references: [id], onDelete: Cascade)
  fileUpload    FileUpload?        @relation(fields: [fileUploadId], references: [id], onDelete: SetNull)
  userProgress  UserProgress[]

  @@map("learning_nodes")
}

model UserProgress {
  id             String    @id @default(uuid())
  userId         String
  learningPathId String
  learningNodeId String
  completed      Boolean   @default(false)
  lastAccessedAt DateTime  @default(now())
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  // Relations
  user          User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  learningPath  LearningPath @relation(fields: [learningPathId], references: [id], onDelete: Cascade)
  learningNode  LearningNode @relation(fields: [learningNodeId], references: [id], onDelete: Cascade)

  @@unique([userId, learningNodeId]) // A user can only have one progress record per node
  @@map("user_progress")
}

model UserStats {
  id              String   @id @default(uuid())
  userId          String   @unique
  coursesCompleted Int      @default(0)
  totalTimeSpent  Int      @default(0) // in minutes
  lastActive      DateTime @default(now())
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // Relations
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("user_stats")
}

model Question {
  id           String         @id @default(uuid())
  text         String
  type         QuestionType
  difficulty   Difficulty
  examId       String?        // Optional, if question belongs to a specific exam
  createdAt    DateTime       @default(now())
  updatedAt    DateTime       @updatedAt

  // Relations
  options      QuestionOption[]
  answers      Answer[]
  exam         Exam?            @relation(fields: [examId], references: [id], onDelete: SetNull)

  @@map("questions")
}

model QuestionOption {
  id         String   @id @default(uuid())
  questionId String
  text       String
  isCorrect  Boolean  @default(false)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  // Relations
  question Question @relation(fields: [questionId], references: [id], onDelete: Cascade)
  answers  Answer[] // To track which answers chose this option

  @@map("question_options")
}

model Exam {
  id          String     @id @default(uuid())
  title       String
  description String?
  type        ExamType
  duration    Int        // in minutes
  passScore   Int        @default(60) // percentage
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  // Relations
  questions   Question[]
  examRecords ExamRecord[]

  @@map("exams")
}

model ExamRecord {
  id          String   @id @default(uuid())
  userId      String
  examId      String
  score       Float?
  isPassed    Boolean?
  startedAt   DateTime @default(now())
  submittedAt DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  user    User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  exam    Exam     @relation(fields: [examId], references: [id], onDelete: Cascade)
  answers Answer[]

  @@map("exam_records")
}

model Answer {
  id           String  @id @default(uuid())
  userId       String
  questionId   String
  examRecordId String?
  optionId     String?
  textAnswer   String? // for open-ended questions
  isCorrect    Boolean @default(false)
  points       Int     @default(0)
  createdAt    DateTime @default(now())

  // Relations
  user       User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  question   Question        @relation(fields: [questionId], references: [id], onDelete: Cascade)
  option     QuestionOption? @relation(fields: [optionId], references: [id], onDelete: SetNull)
  examRecord ExamRecord?     @relation(fields: [examRecordId], references: [id], onDelete: Cascade)

  @@map("answers")
}

// Enums
enum Role {
  ADMIN
  TEACHER
  STUDENT
}

enum Difficulty {
  BEGINNER
  INTERMEDIATE
  ADVANCED
}

enum LearningNodeType {
  CONCEPT
  PRACTICE
  ASSESSMENT
  RESOURCE
}

enum QuestionType {
  SINGLE_CHOICE
  MULTIPLE_CHOICE
  TRUE_FALSE
  FILL_IN_BLANK
  ESSAY
}

enum ExamType {
  QUIZ
  FINAL_EXAM
  PRACTICE
}
TypeScript

// backend/src/prisma/seed.ts
import { PrismaClient, Role, Difficulty, QuestionType, ExamType } from '@prisma/client'
import bcrypt from 'bcrypt'
import { logger } from '../utils/logger'

const prisma = new PrismaClient()

async function main() {
  logger.info('🌱 Starting database seeding...')

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123456', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@ai-lms.com' },
    update: {},
    create: {
      email: 'admin@ai-lms.com',
      name: 'System Administrator',
      password: adminPassword,
      role: Role.ADMIN,
    },
  })

  logger.info('👨‍💼 Created admin user')

  // Create teacher user
  const teacherPassword = await bcrypt.hash('teacher123456', 12)
  const teacher = await prisma.user.upsert({
    where: { email: 'teacher@ai-lms.com' },
    update: {},
    create: {
      email: 'teacher@ai-lms.com',
      name: 'Demo Teacher',
      password: teacherPassword,
      role: Role.TEACHER,
    },
  })

  logger.info('👨‍🏫 Created teacher user')

  // Create student users
  const studentPassword = await bcrypt.hash('student123456', 12)
  const students = await Promise.all([
    prisma.user.upsert({
      where: { email: 'student1@ai-lms.com' },
      update: {},
      create: {
        email: 'student1@ai-lms.com',
        name: 'Alice Student',
        password: studentPassword,
        role: Role.STUDENT,
      },
    }),
    prisma.user.upsert({
      where: { email: 'student2@ai-lms.com' },
      update: {},
      create: {
        email: 'student2@ai-lms.com',
        name: 'Bob Student',
        password: studentPassword,
        role: Role.STUDENT,
      },
    }),
  ])

  logger.info('🧑‍🎓 Created 2 student users')

  // Create some initial learning paths
  const mathPath = await prisma.learningPath.upsert({
    where: { id: 'math-path-1' },
    update: {},
    create: {
      id: 'math-path-1',
      title: 'Advanced Mathematics Foundations',
      description: 'A comprehensive path to master advanced math concepts.',
      userId: teacher.id,
      isPublic: true,
    },
  })

  const csPath = await prisma.learningPath.upsert({
    where: { id: 'cs-path-1' },
    update: {},
    create: {
      id: 'cs-path-1',
      title: 'Introduction to Computer Science',
      description: 'Fundamentals of programming and algorithms.',
      userId: teacher.id,
      isPublic: true,
    },
  })
  logger.info('📚 Created initial learning paths')

  // Create learning nodes for Math Path
  const mathNodes = await prisma.$transaction([
    prisma.learningNode.upsert({
      where: { id: 'math-node-1' },
      update: {},
      create: {
        id: 'math-node-1',
        title: 'Linear Algebra Basics',
        description: 'Introduction to vectors, matrices, and linear equations.',
        type: 'CONCEPT',
        learningPathId: mathPath.id,
        order: 1,
        content: '线性代数是数学的一个分支，研究向量空间、线性变换、线性方程组及其在这些空间中的表示。',
      },
    }),
    prisma.learningNode.upsert({
      where: { id: 'math-node-2' },
      update: {},
      create: {
        id: 'math-node-2',
        title: 'Calculus I: Limits and Derivatives',
        description: 'Understanding limits, continuity, and differentiation rules.',
        type: 'CONCEPT',
        learningPathId: mathPath.id,
        order: 2,
        content: '微积分是研究变化率和累积量的数学分支。极限是微积分的基础概念。',
      },
    }),
    prisma.learningNode.upsert({
      where: { id: 'math-node-3' },
      update: {},
      create: {
        id: 'math-node-3',
        title: 'Practice Problems: Derivatives',
        description: 'Solve various derivative problems.',
        type: 'PRACTICE',
        learningPathId: mathPath.id,
        order: 3,
        content: '请完成以下导数练习题：...',
      },
    }),
  ])
  logger.info('📝 Created learning nodes for Math Path')

  // Create an exam
  const mathExam = await prisma.exam.upsert({
    where: { id: 'math-exam-1' },
    update: {},
    create: {
      id: 'math-exam-1',
      title: 'Linear Algebra & Calculus Midterm',
      description: 'Midterm exam covering linear algebra and basic calculus.',
      type: ExamType.FINAL_EXAM,
      duration: 60, // 60 minutes
      passScore: 70,
    },
  })
  logger.info('📝 Created an exam')

  // Create questions for the exam
  const q1 = await prisma.question.upsert({
    where: { id: 'q1-math-linear' },
    update: {},
    create: {
      id: 'q1-math-linear',
      text: 'What is the dot product of vectors A=[1,2] and B=[3,4]?',
      type: QuestionType.SINGLE_CHOICE,
      difficulty: Difficulty.BEGINNER,
      examId: mathExam.id,
      options: {
        create: [
          { text: '7', isCorrect: false },
          { text: '11', isCorrect: true },
          { text: '10', isCorrect: false },
          { text: '8', isCorrect: false },
        ],
      },
    },
  })

  const q2 = await prisma.question.upsert({
    where: { id: 'q2-math-calculus' },
    update: {},
    create: {
      id: 'q2-math-calculus',
      text: 'Find the derivative of f(x) = x^2 + 3x.',
      type: QuestionType.SINGLE_CHOICE,
      difficulty: Difficulty.INTERMEDIATE,
      examId: mathExam.id,
      options: {
        create: [
          { text: '2x', isCorrect: false },
          { text: 'x^2 + 3', isCorrect: false },
          { text: '2x + 3', isCorrect: true },
          { text: '3x^2', isCorrect: false },
        ],
      },
    },
  })
  logger.info('❓ Created questions for the exam')

  // Create dummy user stats
  await prisma.userStats.upsert({
    where: { userId: students[0].id },
    update: {},
    create: {
      userId: students[0].id,
      coursesCompleted: 1,
      totalTimeSpent: 120,
    },
  })
  logger.info('📊 Created dummy user stats')

  logger.info('✅ Database seeding completed.')
}

main()
  .catch((e) => {
    logger.error('❌ Database seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })


// scripts/init-db.sql
-- This script runs when the PostgreSQL container starts for the first time
-- It's used to apply any initial SQL, like functions or triggers

-- Function to update the `updatedAt` column automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to relevant tables
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_file_uploads_updated_at 
    BEFORE UPDATE ON file_uploads 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_learning_paths_updated_at 
    BEFORE UPDATE ON learning_paths 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_learning_nodes_updated_at 
    BEFORE UPDATE ON learning_nodes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_progress_updated_at 
    BEFORE UPDATE ON user_progress 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_stats_updated_at 
    BEFORE UPDATE ON user_stats 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_questions_updated_at 
    BEFORE UPDATE ON questions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exams_updated_at 
    BEFORE UPDATE ON exams 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exam_records_updated_at 
    BEFORE UPDATE ON exam_records 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add more triggers as needed for other tables with 'updatedAt' column
Plaintext

# .env.example (项目根目录)
# ====================
# 🌍 环境配置
# ====================
NODE_ENV=development

# ====================
# 🗄️ 数据库配置
# ====================
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ai_lms_dev"
POSTGRES_DB=ai_lms_dev
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres

# ====================
# 🔴 Redis 配置
# ====================
REDIS_URL="redis://localhost:6379"

# ====================
# 🔐 JWT 配置
# ====================
JWT_SECRET="your-super-secret-jwt-key-change-in-production-minimum-32-characters"
JWT_EXPIRES_IN="7d"

# ====================
# 🌐 服务器配置
# ====================
HOST=0.0.0.0
PORT=3000
CORS_ORIGIN="http://localhost:5173,http://localhost:3000"

# ====================
# 📁 文件上传配置
# ====================
UPLOAD_PATH="./uploads"
MAX_FILE_SIZE=52428800  # 50MB in bytes

# ====================
# 🤖 AI 服务配置
# ====================
OPENAI_API_KEY="your-openai-api-key-here"
OPENAI_MODEL="gpt-3.5-turbo"
OPENAI_MAX_TOKENS=1000

# ====================
# 🛡️ 安全配置
# ====================
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW="1 minute"

# frontend/.env.example
VITE_API_BASE_URL=http://localhost:3000/api

# backend/.env.example
# This file is used by the backend service.
# It inherits most variables from the root .env, but can override if needed.
# NODE_ENV=development
# PORT=3000
# HOST=0.0.0.0
# DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ai_lms_dev"
# REDIS_URL="redis://localhost:6379"
# JWT_SECRET="your-super-secret-jwt-key-change-in-production-minimum-32-characters"
# JWT_EXPIRES_IN="7d"
# CORS_ORIGIN="http://localhost:5173"
# UPLOAD_PATH="./uploads"
# MAX_FILE_SIZE=52428800
# OPENAI_API_KEY="your-openai-api-key-here"
# OPENAI_MODEL="gpt-3.5-turbo"
# OPENAI_MAX_TOKENS=1000
# RATE_LIMIT_MAX=100
# RATE_LIMIT_WINDOW="1 minute"

# scripts/setup-env.sh
#!/bin/bash

echo "🚀 Setting up AI Learning Management System environment..."

# Create environment files from examples
echo "📄 Creating environment files..."

# Root environment
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ Created .env from .env.example"
else
    echo "ℹ️ .env already exists"
fi

# Frontend environment
if [ ! -f frontend/.env ]; then
    cp frontend/.env.example frontend/.env
    echo "✅ Created frontend/.env from frontend/.env.example"
else
    echo "ℹ️ frontend/.env already exists"
fi

# Backend environment
if [ ! -f backend/.env ]; then
    cp backend/.env.example backend/.env
    echo "✅ Created backend/.env from backend/.env.example"
else
    echo "ℹ️ backend/.env already exists"
fi

# Generate JWT secret
echo "🔐 Generating JWT secret..."
JWT_SECRET=$(openssl rand -base64 32)
sed -i.bak "s/your-super-secret-jwt-key-change-in-production-minimum-32-characters/$JWT_SECRET/g" .env backend/.env
rm -f .env.bak backend/.env.bak

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p backend/logs
mkdir -p backend/uploads
mkdir -p frontend/public/uploads

echo "✅ Environment setup complete!"
echo ""
echo "🔧 Next steps:"
echo "1. Review and update the environment variables in .env files"
echo "2. Add your OpenAI API key to enable AI features"
echo "3. Configure database credentials if using external services"
echo "4. Run 'docker-compose up -d' to start the local development environment"
echo "5. Run 'npm install' in both 'frontend/' and 'backend/' directories"
echo "6. Run 'npm run db:migrate' in 'backend/' to apply Prisma migrations"
echo "7. Run 'npm run db:seed' in 'backend/' to populate initial data"
Plaintext

# backend/Dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies first (for better caching)
COPY package*.json ./\nRUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Create logs directory
RUN mkdir -p logs && chown -R nodejs:nodejs logs

USER nodejs

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

CMD ["npm", "start"]

# docker-compose.yml (开发环境)
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    container_name: ai-lms-postgres
    environment:
      POSTGRES_DB: ai_lms_dev
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/init-db.sql:/docker-entrypoint-initdb.d/init-db.sql # For initial SQL scripts
    networks:
      - ai-lms-network
    restart: unless-stopped

  # Redis Cache
  redis:
    image: redis:7-alpine
    container_name: ai-lms-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - ai-lms-network
    restart: unless-stopped

  # Backend Service
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: ai-lms-backend
    environment:
      NODE_ENV: development
      PORT: 3000
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/ai_lms_dev
      REDIS_URL: redis://redis:6379
      JWT_SECRET: ${JWT_SECRET} # From root .env
      OPENAI_API_KEY: ${OPENAI_API_KEY} # From root .env
      CORS_ORIGIN: http://localhost:5173
    ports:
      - "3000:3000"
    volumes:
      - ./backend:/app # Mount for hot-reloading in dev
      - /app/node_modules # Prevent host node_modules from overwriting container's
      - ./backend/logs:/app/logs
    depends_on:
      - postgres
      - redis
    networks:
      - ai-lms-network
    command: npm run dev # Use tsx watch for development
    restart: unless-stopped

  # Frontend Service
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
    container_name: ai-lms-frontend
    environment:
      VITE_API_BASE_URL: http://localhost:3000/api
    ports:
      - "5173:5173"
    volumes:
      - ./frontend:/app # Mount for hot-reloading in dev
      - /app/node_modules # Prevent host node_modules from overwriting container's
    depends_on:
      - backend
    networks:
      - ai-lms-network
    command: npm run dev # Use vite dev server
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:

networks:
  ai-lms-network:
    driver: bridge

# docker-compose.prod.yml (生产环境)
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: ai-lms-postgres-prod
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_prod_data:/var/lib/postgresql/data
    networks:
      - ai-lms-prod-network
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    container_name: ai-lms-redis-prod
    volumes:
      - redis_prod_data:/data
    networks:
      - ai-lms-prod-network
    restart: unless-stopped

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: ai-lms-backend-prod
    environment:
      NODE_ENV: production
      PORT: 3000
      DATABASE_URL: ${DATABASE_URL}
      REDIS_URL: ${REDIS_URL}
      JWT_SECRET: ${JWT_SECRET}
      OPENAI_API_KEY: ${OPENAI_API_KEY}
    ports:
      - "3000:3000"
    depends_on:
      - postgres
      - redis
    networks:
      - ai-lms-prod-network
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    container_name: ai-lms-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
      - frontend_dist:/usr/share/nginx/html
    depends_on:
      - backend
    networks:
      - ai-lms-prod-network
    restart: unless-stopped

volumes:
  postgres_prod_data:
  redis_prod_data:
  frontend_dist:

networks:
  ai-lms-prod-network:
    driver: bridge

# frontend/Dockerfile.dev (前端开发环境)
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./\nRUN npm ci --only=development && npm cache clean --force

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev"]
TypeScript

// frontend/src/router/AppRouter.tsx
import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { Home } from '@/pages/Home'
import { useAuthStore } from '@/store/authStore'

export const AppRouter = () => {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated)

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="dashboard" element={
          isAuthenticated ? <div>Dashboard Coming Soon</div> : <Navigate to="/" />
        } />
        <Route path="*" element={<Navigate to="/" />} />
      </Route>
    </Routes>
  )
}
TypeScript

// frontend/src/pages/Home.tsx
import { ArrowRightIcon, SparklesIcon, BookOpenIcon, ChartBarIcon } from '@heroicons/react/24/outline'

export const Home = () => {
  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="relative px-6 pt-14 lg:px-8">
        <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56">
          <div className="hidden sm:mb-8 sm:flex sm:justify-center">
            <div className="relative rounded-full px-3 py-1 text-sm leading-6 text-gray-600 ring-1 ring-gray-900/10 hover:ring-gray-900/20">
              AI驱动，个性化学习体验尽在掌控.{' '}
              <a href="#" className="font-semibold text-primary-600">
                <span className="absolute inset-0" aria-hidden="true" />
                了解更多 <span aria-hidden="true">&rarr;</span>
              </a>
            </div>
          </div>
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              智能学习，开启无限可能
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              通过AI个性化推荐、智能测评、高效资源管理，助您轻松掌握知识，成就卓越。
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <a
                href="#"
                className="rounded-md bg-primary-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
              >
                立即开始学习
              </a>
              <a href="#" className="text-sm font-semibold leading-6 text-gray-900">
                了解更多 <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base font-semibold leading-7 text-primary-600">功能强大</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            专为您的学习之旅设计
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            我们的AI学习管理系统提供一系列强大功能，助您高效学习，轻松掌握知识。
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
            <div className="relative pl-16">
              <dt className="text-base font-semibold leading-7 text-gray-900">
                <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600">
                  <SparklesIcon className="h-6 w-6 text-white" aria-hidden="true" />
                </div>
                个性化AI推荐
              </dt>
              <dd className="mt-2 text-base leading-7 text-gray-600">
                根据您的学习进度和偏好，AI智能推荐最适合您的学习路径和资源。
              </dd>
            </div>
            <div className="relative pl-16">
              <dt className="text-base font-semibold leading-7 text-gray-900">
                <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600">
                  <BookOpenIcon className="h-6 w-6 text-white" aria-hidden="true" />
                </div>
                高效资源管理
              </dt>
              <dd className="mt-2 text-base leading-7 text-gray-600">
                轻松上传、组织和查找各类学习资料，打造您的专属知识库。
              </dd>
            </div>
            <div className="relative pl-16">
              <dt className="text-base font-semibold leading-7 text-gray-900">
                <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600">
                  <ChartBarIcon className="h-6 w-6 text-white" aria-hidden="true" />
                </div>
                智能学习评估
              </dt>
              <dd className="mt-2 text-base leading-7 text-gray-600">
                通过AI驱动的测验和考试，精准评估您的学习效果，发现薄弱环节。
              </dd>
            </div>
            <div className="relative pl-16">
              <dt className="text-base font-semibold leading-7 text-gray-900">
                <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600">
                  <ArrowRightIcon className="h-6 w-6 text-white" aria-hidden="true" />
                </div>
                多终端无缝衔接
              </dt>
              <dd className="mt-2 text-base leading-7 text-gray-600">
                支持桌面、平板、手机多终端同步，随时随地开启学习模式。
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  )
}
TypeScript

// frontend/src/components/layout/Layout.tsx
import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { Footer } from './Footer'

export const Layout = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
TypeScript

// frontend/src/components/layout/Header.tsx
import { useState } from 'react'
import { Dialog } from '@headlessui/react'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'

const navigation = [
  { name: '功能特色', href: '#features' },
  { name: '产品演示', href: '#demo' },
  { name: '价格方案', href: '#pricing' },
]

export const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="absolute inset-x-0 top-0 z-50 bg-white shadow-sm">
      <nav className="flex items-center justify-between p-6 lg:px-8" aria-label="Global">
        <div className="flex lg:flex-1">
          <a href="#" className="-m-1.5 p-1.5">
            <span className="sr-only">AI学习管理系统</span>
            <img
              className="h-8 w-auto"
              src="/logo.svg"
              alt="AI LMS Logo"
            />
          </a>
        </div>
        <div className="flex lg:hidden">
          <button
            type="button"
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700"
            onClick={() => setMobileMenuOpen(true)}
          >
            <span className="sr-only">Open main menu</span>
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>
        <div className="hidden lg:flex lg:gap-x-12">
          {navigation.map((item) => (
            <a key={item.name} href={item.href} className="text-sm font-semibold leading-6 text-gray-900">
              {item.name}
            </a>
          ))}
        </div>
        <div className="hidden lg:flex lg:flex-1 lg:justify-end">
          <a href="#" className="text-sm font-semibold leading-6 text-gray-900">
            登录 <span aria-hidden="true">&rarr;</span>
          </a>
        </div>
      </nav>
      <Dialog as="div" className="lg:hidden" open={mobileMenuOpen} onClose={setMobileMenuOpen}>
        <div className="fixed inset-0 z-50" />
        <Dialog.Panel className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-white px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10">
          <div className="flex items-center justify-between">
            <a href="#" className="-m-1.5 p-1.5">
              <span className="sr-only">AI学习管理系统</span>
              <img
                className="h-8 w-auto"
                src="/logo.svg"
                alt="AI LMS Logo"
              />
            </a>
            <button
              type="button"
              className="-m-2.5 rounded-md p-2.5 text-gray-700"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="sr-only">Close menu</span>
              <XMarkIcon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
          <div className="mt-6 flow-root">
            <div className="-my-6 divide-y divide-gray-500/10">
              <div className="space-y-2 py-6">
                {navigation.map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
                  >
                    {item.name}
                  </a>
                ))}
              </div>
              <div className="py-6">
                <a
                  href="#"
                  className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
                >
                  登录
                </a>
              </div>
            </div>
          </div>
        </Dialog.Panel>
      </Dialog>
    </header>
  )
}
TypeScript

// frontend/src/components/layout/Footer.tsx
export const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="mx-auto max-w-7xl px-6 py-12 md:flex md:items-center md:justify-between lg:px-8">
        <div className="flex justify-center space-x-6 md:order-2">
          {/* Social media icons could go here */}
          {/* Example: <a href="#" className="text-gray-400 hover:text-gray-500"><span className="sr-only">Facebook</span><FacebookIcon className="h-6 w-6" aria-hidden="true" /></a> */}
        </div>
        <div className="mt-8 md:order-1 md:mt-0">
          <p className="text-center text-xs leading-5 text-gray-500">
            &copy; 2024 AI学习管理系统. 保留所有权利.
          </p>
        </div>
      </div>
    </footer>
  )
}
TypeScript

// frontend/src/store/authStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  email: string
  name: string
  role: string
  avatar?: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  
  // Actions
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  setUser: (user: User) => void
  setToken: (token: string) => void
  initAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true })
        try {
          // TODO: Replace with actual API call
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.message || 'Login failed')
          }

          const data = await response.json()
          
          set({
            user: data.user,
            token: data.token,
            isAuthenticated: true,
            isLoading: false,
          })
        } catch (error: any) {
          set({ isLoading: false, user: null, token: null, isAuthenticated: false })
          console.error('Login error:', error.message)
          throw error // Re-throw to be caught by UI
        }
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false })
        // TODO: Call backend logout API
        console.log('Logged out.')
      },

      setUser: (user: User) => set({ user }),
      setToken: (token: string) => set({ token, isAuthenticated: !!token }),

      initAuth: () => {
        // This is a placeholder for initial auth check (e.g., check local storage for token)
        // In a real app, you might try to refresh token or validate existing one
        const storedState = localStorage.getItem('auth-storage')
        if (storedState) {
          const { state } = JSON.parse(storedState)
          if (state.token && state.user) {
            set({ user: state.user, token: state.token, isAuthenticated: true })
          }
        }
      }
    }),
    {
      name: 'auth-storage', // name of the item in localStorage
      getStorage: () => localStorage, // use localStorage for storage
      partialize: (state) =>
        Object.fromEntries(
          Object.entries(state).filter(([key]) => ['token', 'user', 'isAuthenticated'].includes(key))
        ),
    }
  )
)
TypeScript

// frontend/src/utils/api.ts
import axios from 'axios'
import { useAuthStore } from '@/store/authStore'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'

export const apiService = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 seconds
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add authorization token
apiService.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle global errors (e.g., 401 Unauthorized)
apiService.interceptors.response.use(
  (response) => {
    return response
  },
  async (error) => {
    const originalRequest = error.config
    // If the error is 401 and it's not a retry (to prevent infinite loops)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      // Here, you might implement token refresh logic
      // For now, just clear auth and redirect to login
      useAuthStore.getState().logout()
      // Optionally redirect to login page
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)
TypeScript

// frontend/src/utils/cn.ts
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Utility function to conditionally join Tailwind CSS classes.
 * It uses `clsx` for conditional class joining and `tailwind-merge`
 * for intelligently merging Tailwind classes, resolving conflicts.
 *
 * @param inputs - Class values to be joined and merged.
 * @returns A single string containing the merged Tailwind CSS classes.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
TypeScript

// frontend/src/utils/constants.ts
export const APP_CONFIG = {
  APP_NAME: 'AI学习管理系统',
  VERSION: '1.0.0',
  API_VERSION: 'v1',
  
  // File upload limits
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  ALLOWED_FILE_TYPES: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'image/jpeg',
    'image/png',
    'image/gif',
  ],
  
  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  
  // Timeouts
  REQUEST_TIMEOUT: 10000,
  
  // Routes
  ROUTES: {
    HOME: '/',
    LOGIN: '/login',
    REGISTER: '/register',
    DASHBOARD: '/dashboard',
    PROFILE: '/profile',
    FORGOT_PASSWORD: '/forgot-password',
    RESET_PASSWORD: '/reset-password',
    // Add more routes as needed
  },

  // Roles
  ROLES: {
    ADMIN: 'ADMIN',
    TEACHER: 'TEACHER',
    STUDENT: 'STUDENT',
  },

  // Permissions (example, define based on your needs)
  PERMISSIONS: {
    MANAGE_USERS: 'manage_users',
    CREATE_COURSE: 'create_course',
    VIEW_REPORTS: 'view_reports',
    UPLOAD_FILES: 'upload_files',
    ACCESS_AI_TOOLS: 'access_ai_tools',
  },
}
CSS

/* frontend/src/styles/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom styles for the AI LMS */

:root {
  --color-primary-50: #eff6ff;
  --color-primary-100: #dbeafe;
  --color-primary-200: #bfdbfe;
  --color-primary-300: #93c5fd;
  --color-primary-400: #60a5fa;
  --color-primary-500: #3b82f6;
  --color-primary-600: #2563eb;
  --color-primary-700: #1d4ed8;
  --color-primary-800: #1e40af;
  --color-primary-900: #1e3a8a;
  --color-primary-950: #172554;
}

@layer base {
  html {
    @apply scroll-smooth;
  }
  body {
    @apply font-sans antialiased text-gray-800 bg-gray-50;
  }
  h1, h2, h3, h4, h5, h6 {
    @apply font-bold text-gray-900;
  }
  a {
    @apply text-primary-600 hover:text-primary-800 transition-colors duration-200;
  }
  button {
    @apply focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500;
  }
}

@layer components {
  /* Common layout styles */
  .container {
    @apply mx-auto max-w-7xl px-4 sm:px-6 lg:px-8;
  }

  /* Animations */
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .animate-fadeIn {
    animation: fadeIn 0.5s ease-out;
  }

  @keyframes slideInFromLeft {
    from { transform: translateX(-100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }

  .animate-slideInFromLeft {
    animation: slideInFromLeft 0.5s ease-out;
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .animate-slideUp {
    animation: slideUp 0.4s ease-out;
  }

  /* Form styles */
  .form-input {
    @apply block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm;
  }

  .form-select {
    @apply block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm;
  }

  .form-textarea {
    @apply block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm;
  }

  /* Error states */
  .form-input-error {
    @apply border-red-300 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500;
  }

  /* Loading states */
  .loading-overlay {
    @apply absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center;
  }

  .loading-spinner {
    @apply animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600;
  }

  /* Card styles */
  .card {
    @apply bg-white shadow-sm rounded-lg border border-gray-200;
  }

  .card-header {
    @apply px-6 py-4 border-b border-gray-200;
  }

  .card-body {
    @apply p-6;
  }
}
Plaintext

# .github/workflows/ci.yml
name: 🚀 CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

env:
  NODE_VERSION: '18'
  POSTGRES_VERSION: '15'
  REDIS_VERSION: '7'

jobs:
  # ===========================
  # 🔍 代码质量检查
  # ===========================
  lint:
    name: 🧹 Lint & Format Check
    runs-on: ubuntu-latest
    
    steps:
      - name: 📥 Checkout code
        uses: actions/checkout@v4

      - name: 📦 Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: 📥 Install frontend dependencies
        working-directory: ./frontend
        run: npm ci

      - name: 📥 Install backend dependencies
        working-directory: ./backend
        run: npm ci

      - name: 🧹 Lint frontend
        working-directory: ./frontend
        run: |
          npm run lint
          npm run type-check

      - name: 🧹 Lint backend
        working-directory: ./backend
        run: |
          npm run lint
          npm run type-check

      - name: 🎨 Check code formatting
        run: |
          cd frontend && npm run format -- --check
          cd ../backend && npm run format -- --check

  # ===========================
  # 🧪 后端测试
  # ===========================
  test-backend:
    name: 🧪 Backend Tests
    runs-on: ubuntu-latest
    needs: lint
    services:
      postgres:
        image: postgres:${{ env.POSTGRES_VERSION }}-alpine
        env:
          POSTGRES_DB: test_db
          POSTGRES_USER: test_user
          POSTGRES_PASSWORD: test_password
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      redis:
        image: redis:${{ env.REDIS_VERSION }}-alpine
        ports:
          - 6379:6379
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - name: 📥 Checkout code
        uses: actions/checkout@v4

      - name: 📦 Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          
      - name: ⏰ Wait for services
        run: |
          echo "Waiting for PostgreSQL..."
          for i in `seq 1 10`; do
            nc -z localhost 5432 && break
            echo "PostgreSQL not ready, sleeping for 5s..."
            sleep 5
          done
          echo "PostgreSQL is ready!"
          
          echo "Waiting for Redis..."
          for i in `seq 1 10`; do
            nc -z localhost 6379 && break
            echo "Redis not ready, sleeping for 5s..."
            sleep 5
          done
          echo "Redis is ready!"

      - name: 📥 Install backend dependencies
        working-directory: ./backend
        run: npm ci

      - name: ⚙️ Setup Prisma for tests
        working-directory: ./backend
        run: |
          npx prisma migrate deploy # Apply migrations for test DB
          npx prisma db seed # Seed test data
        env:
          DATABASE_URL: postgresql://test_user:test_password@localhost:5432/test_db

      - name: 🧪 Run backend tests
        working-directory: ./backend
        run: npm test -- --coverage
        env:
          DATABASE_URL: postgresql://test_user:test_password@localhost:5432/test_db
          REDIS_URL: redis://localhost:6379
          JWT_SECRET: test-secret-for-ci-minimum-32-characters
          NODE_ENV: test

      - name: ⬆️ Upload Coverage Report
        uses: codecov/codecov-action@v3
        with:
          flags: backend
          directory: ./backend/coverage

  # ===========================
  # 📦 构建 & 部署 (仅在main/develop分支push时)
  # ===========================
  build-and-deploy:
    name: 🏗️ Build & Deploy
    runs-on: ubuntu-latest
    needs: [lint, test-backend]
    if: github.event_name == 'push' && (github.ref == 'refs/heads/main' || github.ref == 'refs/heads/develop')

    steps:
      - name: 📥 Checkout code
        uses: actions/checkout@v4

      - name: 📦 Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: 📥 Install dependencies
        run: |
          cd frontend && npm ci
          cd ../backend && npm ci

      - name: 🏗️ Build applications
        run: |
          cd frontend && npm run build
          cd ../backend && npm run build

      - name: 📦 Create release archive
        run: |
          mkdir release
          cp -r frontend/dist release/frontend
          cp -r backend/dist release/backend
          cp -r backend/prisma release/ # Include prisma schema for migrations
          cp docker-compose.prod.yml release/
          tar -czf ai-lms-${{ github.ref_name }}.tar.gz release/

      - name: 📝 Generate changelog
        id: changelog
        run: |
          echo "## Changes in ${{ github.ref_name }}" > CHANGELOG.md
          git log --oneline --no-merges $(git describe --tags --abbrev=0 HEAD^)..HEAD >> CHANGELOG.md

      - name: 🚀 Create GitHub Release
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: ${{ github.ref }}
          release_name: Release ${{ github.ref_name }}
          body_path: CHANGELOG.md
          draft: false
          prerelease: false

      - name: 📦 Upload release asset
        uses: actions/upload-release-asset@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          upload_url: ${{ steps.create_release.outputs.upload_url }}
          asset_path: ./ai-lms-${{ github.ref_name }}.tar.gz
          asset_name: ai-lms-${{ github.ref_name }}.tar.gz
          asset_content_type: application/gzip
Plaintext

# README.md
# AI学习管理系统

> 基于React + Node.js的AI驱动学习管理系统，采用微服务架构，提供个性化学习路径和智能测评功能。

## ✨ 项目特色

- 🤖 **AI驱动**: 集成OpenAI API，智能分析学习资料，生成个性化学习路径
- 📊 **数据可视化**: 使用Recharts和Chart.js提供丰富的学习数据展示
- 🔒 **安全可靠**: JWT认证、数据加密、API限流等多重安全保障
- 📱 **响应式设计**: 完美适配桌面端和移动端
- 🚀 **高性能**: Fastify后端、Redis缓存、Docker容器化部署
- 🛠️ **现代技术栈**: React 18、TypeScript、Tailwind CSS、Prisma ORM

## 🏗️ 技术架构

### 前端技术栈
- **框架**: React 18 + TypeScript
- **构建工具**: Vite
- **样式**: Tailwind CSS + Headless UI
- **状态管理**: Zustand
- **路由**: React Router v6
- **UI组件**: Radix UI + Lucide React
- **图表**: Recharts + Chart.js
- **表单**: React Hook Form + Zod
- **HTTP客户端**: Axios + TanStack Query

### 后端技术栈
- **运行时**: Node.js 18+
- **框架**: Fastify
- **语言**: TypeScript
- **数据库**: PostgreSQL 15 + Prisma ORM
- **缓存**: Redis
- **认证**: JWT + bcrypt
- **文件存储**: MinIO/AWS S3
- **API文档**: Swagger/OpenAPI

### 部署运维
- **容器化**: Docker + Docker Compose
- **部署**: Vercel (前端) + Railway/Render (后端)
- **CDN**: Cloudflare
- **监控**: Sentry + Uptime Robot
- **CI/CD**: GitHub Actions

## 快速开始

### 🚀 环境准备

1.  **Node.js**: 确保安装 Node.js 18+。
2.  **Docker**: 安装 Docker Desktop 或 Docker Engine。
3.  **Git**: 安装 Git。

### ⚙️ 设置项目

1.  **克隆仓库**:
    ```bash
    git clone [https://github.com/your-username/ai-lms.git](https://github.com/your-username/ai-lms.git)
    cd ai-lms
    ```

2.  **环境配置**:
    运行脚本复制 `.env.example` 文件并生成JWT密钥。
    ```bash
    chmod +x scripts/setup-env.sh
    ./scripts/setup-env.sh
    ```
    * **重要**: 打开 `.env` 文件，更新 `DATABASE_URL`, `REDIS_URL` 和 `OPENAI_API_KEY` 为您的实际配置。

3.  **启动开发环境**:
    使用 Docker Compose 启动 PostgreSQL, Redis, 后端和前端服务。
    ```bash
    docker-compose up -d
    ```
    * 等待服务完全启动 (可能需要几分钟)。

4.  **安装依赖**:
    ```bash
    cd frontend && npm install
    cd ../backend && npm install
    ```

5.  **数据库初始化**:
    在 `backend` 目录中运行 Prisma 命令来生成客户端、应用迁移并填充初始数据。
    ```bash
    cd backend
    npx prisma generate
    npx prisma migrate dev --name init # 创建并应用数据库迁移
    npx prisma db seed # 填充初始数据 (管理员/教师/学生账户)
    cd ..
    ```

### ▶️ 运行应用

1.  **前端**:
    在 `frontend` 目录下启动开发服务器。
    ```bash
    cd frontend
    npm run dev
    ```
    前端应用将在 `http://localhost:5173` 启动。

2.  **后端**:
    后端服务已由 Docker Compose 启动并运行在 `http://localhost:3000`。
    API 文档可在 `http://localhost:3000/docs` 访问。

### 停止服务
```bash
docker-compose down
📂 项目结构
ai-lms/
├── .github/                 # GitHub Actions CI/CD 配置
│   └── workflows/
│       └── ci.yml
├── backend/                 # 后端服务 (Node.js/Fastify)
│   ├── src/
│   │   ├── config/          # 环境变量、数据库、Redis配置
│   │   ├── middlewares/     # 认证、错误处理、验证中间件
│   │   ├── prisma/          # Prisma Schema 和 seed 文件
│   │   ├── routes/          # API 路由定义 (auth, health, etc.)
│   │   ├── services/        # 业务逻辑服务 (e.g., email, openai)
│   │   ├── utils/           # 工具函数 (logger, helpers)
│   │   ├── app.ts           # Fastify 应用入口
│   │   └── server.ts        # 服务器启动文件
│   ├── Dockerfile           # 后端 Dockerfile
│   ├── package.json
│   └── tsconfig.json
├── frontend/                # 前端应用 (React/Vite)
│   ├── public/              # 静态资源 (logo.svg)
│   ├── src/
│   │   ├── assets/          # 静态图片、字体等
│   │   ├── components/      # 可复用 UI 组件 (layout, ui, auth)
│   │   ├── hooks/           # 自定义 React Hooks
│   │   ├── pages/           # 页面组件 (Home, Dashboard, Auth)
│   │   ├── router/          # React Router 配置
│   │   ├── store/           # Zustand 状态管理
│   │   ├── styles/          # Tailwind CSS 和全局样式
│   │   ├── utils/           # 工具函数 (api service, cn util, constants)
│   │   ├── App.tsx          # 主应用组件
│   │   └── main.tsx         # 应用入口
│   ├── Dockerfile.dev       # 前端开发 Dockerfile
│   ├── package.json
│   └── tsconfig.json
├── scripts/                 # 辅助脚本 (setup-env.sh, init-db.sql)
├── .env.example             # 根目录环境变量示例
├── docker-compose.yml       # 开发环境 Docker Compose
├── docker-compose.prod.yml  # 生产环境 Docker Compose
└── README.md                # 项目文档
🌍 API 参考
健康检查
GET /api/health - 检查服务健康状态
认证
POST /api/auth/register - 用户注册
POST /api/auth/login - 用户登录
GET /api/auth/profile - 获取用户信息
POST /api/auth/logout - 用户登出
文件管理
POST /api/files/upload - 文件上传
GET /api/files - 获取文件列表
DELETE /api/files/:id - 删除文件
学习路径
GET /api/learning/paths - 获取学习路径
POST /api/learning/paths - 创建学习路径
PUT /api/learning/progress - 更新学习进度
考试系统
GET /api/exams - 获取考试列表
POST /api/exams/:id/start - 开始考试
POST /api/exams/:id/submit - 提交答案
完整API文档请访问: http://localhost:3000/docs

🧪 测试
运行测试
Bash

# 前端测试
cd frontend && npm test

# 后端测试
cd backend && npm test

# 端到端测试
npm run test:e2e
代码覆盖率
Bash

# 生成覆盖率报告
npm run test:coverage
📦 部署
开发环境
Bash

# 启动开发环境
docker-compose up -d
生产环境
Bash

# 构建生产镜像
docker-compose -f docker-compose.prod.yml up -d
云部署
Vercel (前端)
连接GitHub仓库
设置环境变量
自动部署
Railway (后端)
连接GitHub仓库
配置数据库和环境变量
自动部署
其他
MinIO (文件存储): 作为AWS S3的替代方案，可以在本地部署。
Cloudflare: CDN加速和DNS管理。
🤝 贡献
欢迎提交Issue和Pull Request！

📄 许可证
MIT License.