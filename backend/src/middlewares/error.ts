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
