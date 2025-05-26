import dotenv from 'dotenv'
import path from 'path'
import { z } from 'zod'

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../../.env') }) 

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
  
  MINIO_ENDPOINT: z.string().default('localhost'),
  MINIO_PORT: z.preprocess(Number, z.number().default(9000)),
  MINIO_USE_SSL: z.preprocess((val) => val === 'true', z.boolean().default(false)),
  MINIO_ACCESS_KEY: z.string().default('minioadmin'),
  MINIO_SECRET_KEY: z.string().default('minioadmin123'),
  MINIO_BUCKET_NAME: z.string().default('ai-lms-files'),
  
  UPLOAD_PATH: z.string().default('./uploads'), 
  ALLOWED_FILE_TYPES: z.string().default('pdf,doc,docx,txt,jpg,jpeg,png,gif,mp4,mp3'), 
  MAX_FILE_SIZE: z.preprocess(Number, z.number().default(50 * 1024 * 1024)), 
  CHUNK_SIZE: z.preprocess(Number, z.number().default(5 * 1024 * 1024)), 

  // AI Configuration (from DAY5, merging with DAY1)
  AI_PROVIDER: z.enum(['openai', 'ollama']).default('openai'), // New from DAY5
  OLLAMA_BASE_URL: z.string().default('http://localhost:11434'), // New from DAY5
  OLLAMA_MODEL: z.string().default('llama2'), // New from DAY5
  OPENAI_API_KEY: z.string().optional(), 
  OPENAI_MODEL: z.string().default('gpt-3.5-turbo'), 
  OPENAI_MAX_TOKENS: z.preprocess(Number, z.number().default(1000)), 
  AI_MONTHLY_TOKEN_LIMIT: z.preprocess(Number, z.number().default(1000000)), // New from DAY5
  AI_REQUEST_TIMEOUT: z.preprocess(Number, z.number().default(30000)), // New from DAY5
  
  // Queue Configuration (from DAY5)
  QUEUE_REDIS_URL: z.string().optional(), // New from DAY5
  MAX_CONCURRENT_JOBS: z.preprocess(Number, z.number().default(5)), // New from DAY5

  RATE_LIMIT_MAX: z.preprocess(Number, z.number().default(100)), 
  RATE_LIMIT_WINDOW: z.string().default('1 minute'), 
})

// Parse and validate environment variables
const parsedEnv = envSchema.safeParse(process.env)

if (!parsedEnv.success) {
  console.error('❌ Invalid environment variables:', parsedEnv.error.format())
  throw new Error('Invalid environment variables')
}

export const env = parsedEnv.data
