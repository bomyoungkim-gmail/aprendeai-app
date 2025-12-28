/**
 * Environment Variables Validation
 * 
 * Validates and provides type-safe access to environment variables.
 * Uses Zod for runtime validation.
 */

import { z } from 'zod';

// ========================================
// SCHEMA
// ========================================

const envSchema = z.object({
  // API Configuration
  NEXT_PUBLIC_API_URL: z.string().url({
    message: 'NEXT_PUBLIC_API_URL must be a valid URL',
  }),
  NEXT_PUBLIC_WS_URL: z.string().url().optional(),

  // Node Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Feature Flags (Refactoring - from Fase 0.3)
  NEXT_PUBLIC_USE_SERVICES: z.string().optional(),
  NEXT_PUBLIC_USE_NEW_HOOKS: z.string().optional(),
  NEXT_PUBLIC_USE_STORAGE: z.string().optional(),
  NEXT_PUBLIC_USE_WS_SERVICE: z.string().optional(),
  NEXT_PUBLIC_USE_OFFLINE_QUEUE: z.string().optional(),
});

// ========================================
// TYPE
// ========================================

export type Env = z.infer<typeof envSchema>;

// ========================================
// VALIDATION
// ========================================

/**
 * Parse and validate environment variables
 */
function parseEnv(): Env {
  try {
    return envSchema.parse({
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
      NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL,
      NODE_ENV: process.env.NODE_ENV,
      NEXT_PUBLIC_USE_SERVICES: process.env.NEXT_PUBLIC_USE_SERVICES,
      NEXT_PUBLIC_USE_NEW_HOOKS: process.env.NEXT_PUBLIC_USE_NEW_HOOKS,
      NEXT_PUBLIC_USE_STORAGE: process.env.NEXT_PUBLIC_USE_STORAGE,
      NEXT_PUBLIC_USE_WS_SERVICE: process.env.NEXT_PUBLIC_WS_SERVICE,
      NEXT_PUBLIC_USE_OFFLINE_QUEUE: process.env.NEXT_PUBLIC_USE_OFFLINE_QUEUE,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Invalid environment variables:');
      console.error(error.format());
    }
    throw new Error('Failed to validate environment variables. Check console for details.');
  }
}

// ========================================
// EXPORT
// ========================================

/**
 * Validated environment variables
 * 
 * @example
 * import { env } from '@/lib/config/env';
 * const apiUrl = env.NEXT_PUBLIC_API_URL; // Type-safe!
 */
export const env = parseEnv();

// Log loaded env in development
if (env.NODE_ENV === 'development') {
  console.log('[env] Loaded environment variables:', {
    API_URL: env.NEXT_PUBLIC_API_URL,
    WS_URL: env.NEXT_PUBLIC_WS_URL || 'not set',
    NODE_ENV: env.NODE_ENV,
  });
}
