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
  SMTP_HOST: z.string().default('smtp.gmail.com'),
  SMTP_PORT: z
    .string()
    .default('587')
    .transform((val) => Number.parseInt(val, 10))
    .refine((port) => Number.isInteger(port) && port > 0 && port <= 65535, {
      message: 'SMTP_PORT must be a valid port number between 1 and 65535'
    }),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM_EMAIL: z.string().optional(),
  SMTP_FROM_NAME: z.string().default('TheSiniySky'),
  CONTACT_EMAIL: z
    .string()
    .email('CONTACT_EMAIL must be a valid email address')
    .default('akashkumarhzb121@gmail.com')
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
