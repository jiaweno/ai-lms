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
