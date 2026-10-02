import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables from .env file
dotenv.config();

const envSchema = z.object({
  PORT: z
    .string()
    .default('5000')
    .transform((val) => parseInt(val, 10))
    .refine((port) => !isNaN(port) && port > 0 && port <= 65535, {
      message: 'PORT must be a valid port number between 1 and 65535'
    }),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  MONGODB_URI: z
    .string()
    .min(1, 'MONGODB_URI is required')
    .transform((uri) => {
      // Remove accidental literal < > placeholder brackets from Atlas password if present
      return uri.replace(/(mongodb(?:\+srv)?:\/\/[^:]+):<([^>]+)>(@.*)/, '$1:$2$3');
    })
    .default(process.env.NODE_ENV === 'test' ? 'mongodb://localhost:27017/portfolio-test' : ''),
  FRONTEND_ORIGINS: z
    .string()
    .default('http://localhost:5173')
    .transform((val) =>
      val
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean)
    ),
  RESEND_API_KEY: z.string().min(1, 'RESEND_API_KEY is required'),
  CONTACT_EMAIL: z
    .string()
    .email('CONTACT_EMAIL must be a valid email address')
    .default('akashkumarhzb121@gmail.com'),
  // LLM Chat Provider (Defaults to Groq free tier, fully configurable)
  AI_API_KEY: z.string().default(process.env.AI_API_KEY || process.env.GROQ_API_KEY || ''),
  AI_MODEL: z.string().default(process.env.AI_MODEL || 'llama-3.3-70b-versatile'),
  AI_BASE_URL: z.string().default(process.env.AI_BASE_URL || 'https://api.groq.com/openai/v1'),

  // Separate Embeddings Provider Configuration (Do not use Groq chat models for embeddings)
  EMBEDDING_API_KEY: z.string().default(process.env.EMBEDDING_API_KEY || ''),
  EMBEDDING_BASE_URL: z.string().default(process.env.EMBEDDING_BASE_URL || 'https://api.openai.com/v1'),
  EMBEDDING_MODEL: z.string().default(
    process.env.EMBEDDING_MODEL || process.env.AI_EMBEDDING_MODEL || 'text-embedding-3-small'
  ),
  AI_RATE_LIMIT_WINDOW_MINUTES: z
    .union([z.string(), z.number()])
    .default('15')
    .transform((val) => (typeof val === 'number' ? val : parseInt(val, 10)))
    .refine((val) => !isNaN(val) && val > 0, {
      message: 'AI_RATE_LIMIT_WINDOW_MINUTES must be a positive number'
    }),
  AI_RATE_LIMIT_MAX_REQUESTS: z
    .union([z.string(), z.number()])
    .default('30')
    .transform((val) => (typeof val === 'number' ? val : parseInt(val, 10)))
    .refine((val) => !isNaN(val) && val > 0, {
      message: 'AI_RATE_LIMIT_MAX_REQUESTS must be a positive number'
    }),
  ADMIN_API_KEY: z.string().default(process.env.ADMIN_API_KEY || 'akash_admin_2026')
});

export type EnvConfig = z.infer<typeof envSchema>;

let parsedEnv: EnvConfig;

try {
  parsedEnv = envSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    const formattedErrors = error.issues
      .map((err) => `  - ${err.path.join('.')}: ${err.message}`)
      .join('\n');
    console.error(`\n❌ Invalid server environment configuration:\n${formattedErrors}\n`);
  }
  // If running in development and some keys are missing, provide informative defaults
  if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
    parsedEnv = envSchema.parse({
      ...process.env,
      MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/portfolio_dev',
      CONTACT_EMAIL: process.env.CONTACT_EMAIL || 'akashkumarhzb121@gmail.com'
    });
  } else {
    throw error;
  }
}

export const env = parsedEnv;
