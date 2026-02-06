import { z } from 'zod';

// Schema for environment variables
const envSchema = z.object({
  // Application
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  APP_PORT: z.string().default('3000').transform(Number),
  APP_URL: z.string().default('http://localhost:3000'),
  API_PREFIX: z.string().default('/api'),

  // Database
  DATABASE_URL: z.string().url(),

  // Logging
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  LOG_PRETTY: z.string().default('true').transform((val: string) => val === 'true'),

  // Security
  JWT_SECRET: z.string().min(32).default('your-jwt-secret-key-change-in-production'),
  API_RATE_LIMIT_WINDOW_MS: z.string().default('900000').transform(Number),
  API_RATE_LIMIT_MAX_REQUESTS: z.string().default('100').transform(Number),

  // NextAuth (optional)
  NEXTAUTH_SECRET: z.string().optional(),
  NEXTAUTH_URL: z.string().url().optional(),

  // Email (optional)
  EMAIL_SERVER: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),

  // External Services (optional)
  SENTRY_DSN: z.string().url().optional().or(z.literal('')),
});

// Parse environment variables
const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Invalid environment variables:', parsedEnv.error.format());
  throw new Error('Invalid environment variables');
}

export const config = parsedEnv.data;
export type Config = typeof config;

// Helper to get config with type safety
export function getConfig(): Config {
  return config;
}

// Environment checks
export const isDevelopment = config.NODE_ENV === 'development';
export const isTest = config.NODE_ENV === 'test';
export const isProduction = config.NODE_ENV === 'production';