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
  RESEND_API_KEY: z
    .string()
    .min(1, 'RESEND_API_KEY is required')
    .default(process.env.NODE_ENV === 'test' ? 're_test_key' : ''),
  CONTACT_EMAIL: z
    .string()
    .email('CONTACT_EMAIL must be a valid email address')
    .default(process.env.NODE_ENV === 'test' ? 'test@example.com' : ''),
  EMAIL_FROM: z
    .string()
    .default('Portfolio Contact <onboarding@resend.dev>')
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
  // If running in development and some keys are missing, provide informative guidance
  if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
    parsedEnv = envSchema.parse({
      ...process.env,
      MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/portfolio_dev',
      RESEND_API_KEY: process.env.RESEND_API_KEY || 're_dummy_dev_key',
      CONTACT_EMAIL: process.env.CONTACT_EMAIL || 'dev@example.com'
    });
  } else {
    throw error;
  }
}

export const env = parsedEnv;
