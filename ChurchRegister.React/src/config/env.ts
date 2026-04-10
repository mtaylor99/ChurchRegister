import { z } from 'zod';

/**
 * Environment Variable Schema
 *
 * Defines and validates all environment variables used in the application.
 * This provides type safety and runtime validation for configuration.
 */
const envSchema = z.object({
  // API Configuration
  VITE_API_BASE_URL: z
    .string()
    .url('VITE_API_BASE_URL must be a valid URL')
    .default('http://localhost:5502'),

  VITE_API_TIMEOUT: z
    .string()
    .default('30000')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().positive('VITE_API_TIMEOUT must be a positive number')),

  // Authentication
  VITE_AUTH_TOKEN_KEY: z
    .string()
    .min(1, 'VITE_AUTH_TOKEN_KEY is required')
    .default('churchregister_auth_token'),

  VITE_AUTH_REFRESH_KEY: z
    .string()
    .min(1, 'VITE_AUTH_REFRESH_KEY is required')
    .default('churchregister_refresh_token'),

  // Environment
  VITE_NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),

  // Feature Flags
  VITE_ENABLE_DEVTOOLS: z
    .string()
    .default('false')
    .transform((val) => val === 'true')
    .pipe(z.boolean()),

  VITE_ENABLE_STORYBOOK: z
    .string()
    .default('false')
    .transform((val) => val === 'true')
    .pipe(z.boolean()),

  // Monitoring
  VITE_ENABLE_ANALYTICS: z
    .string()
    .default('false')
    .transform((val) => val === 'true')
    .pipe(z.boolean()),

  VITE_ENABLE_LOGGING: z
    .string()
    .default('true')
    .transform((val) => val === 'true')
    .pipe(z.boolean()),

  VITE_SENTRY_DSN: z
    .string()
    .url('VITE_SENTRY_DSN must be a valid URL')
    .optional()
    .or(z.literal('')),

  // Debug
  VITE_DEBUG_MODE: z
    .string()
    .default('false')
    .transform((val) => val === 'true')
    .pipe(z.boolean()),

  // Vite Built-in Variables
  MODE: z.enum(['development', 'production', 'test']).default('development'),
  DEV: z.boolean().default(true),
  PROD: z.boolean().default(false),
  SSR: z.boolean().default(false),
});

/**
 * Parse and validate environment variables
 *
 * This function runs at application startup to ensure all required
 * environment variables are present and valid.
 *
 * @throws {Error} If required environment variables are missing or invalid
 */
function validateEnv() {
  try {
    const parsed = envSchema.parse({
      // Custom environment variables
      VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
      VITE_API_TIMEOUT: import.meta.env.VITE_API_TIMEOUT,
      VITE_AUTH_TOKEN_KEY: import.meta.env.VITE_AUTH_TOKEN_KEY,
      VITE_AUTH_REFRESH_KEY: import.meta.env.VITE_AUTH_REFRESH_KEY,
      VITE_NODE_ENV: import.meta.env.VITE_NODE_ENV,
      VITE_ENABLE_DEVTOOLS: import.meta.env.VITE_ENABLE_DEVTOOLS,
      VITE_ENABLE_STORYBOOK: import.meta.env.VITE_ENABLE_STORYBOOK,
      VITE_ENABLE_ANALYTICS: import.meta.env.VITE_ENABLE_ANALYTICS,
      VITE_ENABLE_LOGGING: import.meta.env.VITE_ENABLE_LOGGING,
      VITE_SENTRY_DSN: import.meta.env.VITE_SENTRY_DSN,
      VITE_DEBUG_MODE: import.meta.env.VITE_DEBUG_MODE,

      // Vite built-in variables
      MODE: import.meta.env.MODE,
      DEV: import.meta.env.DEV,
      PROD: import.meta.env.PROD,
      SSR: import.meta.env.SSR,
    });

    return parsed;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.issues
        .map((err) => `${err.path.join('.')}: ${err.message}`)
        .join('\n');

      console.error(
        '❌ Environment variable validation failed:\n',
        errorMessage
      );
      throw new Error(
        `Environment variable validation failed:\n${errorMessage}`
      );
    }
    throw error;
  }
}

/**
 * Validated environment variables
 *
 * Use this object throughout the application instead of accessing
 * import.meta.env directly. This ensures type safety and catches
 * configuration errors at startup rather than runtime.
 *
 * @example
 * ```typescript
 * import { env } from '@config/env';
 *
 * const apiClient = axios.create({
 *   baseURL: env.VITE_API_BASE_URL,
 *   timeout: env.VITE_API_TIMEOUT,
 * });
 * ```
 */
export const env = validateEnv();

/**
 * Type-safe environment variable interface
 */
export type Env = z.infer<typeof envSchema>;

/**
 * Helper function to check if running in development mode
 */
export const isDevelopment = () => env.MODE === 'development' || env.DEV;

/**
 * Helper function to check if running in production mode
 */
export const isProduction = () => env.MODE === 'production' || env.PROD;

/**
 * Helper function to check if running in test mode
 */
export const isTest = () => env.MODE === 'test';
