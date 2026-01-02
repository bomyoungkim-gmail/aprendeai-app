/**
 * Centralized URL Configuration for Backend API
 *
 * This file provides a single source of truth for all service URLs.
 * Benefits:
 * - Easy environment management
 * - Type-safe URL access
 * - Fails fast in production if required env vars missing
 * - Easy to audit all external dependencies
 */

const NODE_ENV = process.env.NODE_ENV || "development";
const IS_PRODUCTION = NODE_ENV === "production";
const IS_TEST = NODE_ENV === "test";

/**
 * Throws error if required env var is missing in production
 */
function requireInProduction(envVar: string, fallback?: string): string {
  const value = process.env[envVar];

  if (!value) {
    if (IS_PRODUCTION) {
      throw new Error(
        `❌ FATAL: ${envVar} environment variable is required in production but not set.`,
      );
    }

    // Allow skipping check in test environment, using fallback if provided
    if (IS_TEST) {
      if (fallback === undefined) {
        // In test, if no value and no fallback, return an empty string to satisfy type,
        // as we're skipping the check.
        return "";
      }
      return fallback;
    }

    if (fallback) {
      console.warn(`⚠️  ${envVar} not set, using fallback: ${fallback}`);
      return fallback;
    }

    throw new Error(`${envVar} is required but not set`);
  }

  return value;
}

/**
 * Gets env var with development fallback
 */
function getWithFallback(envVar: string, devFallback: string): string {
  return process.env[envVar] || (IS_TEST ? devFallback : devFallback);
}

/**
 * URL Configuration
 */
export const URL_CONFIG = {
  // Frontend URL
  frontend: {
    base: requireInProduction("FRONTEND_URL", "http://localhost:3000"),

    // Derived URLs
    get verify(): string {
      return `${this.base}/extension/verify`;
    },
  },

  // AI Service URL
  ai: {
    base: requireInProduction("AI_SERVICE_URL", "http://localhost:8001"),

    // AI Endpoints
    get educator(): string {
      return `${this.base}/educator/turn`;
    },
    get health(): string {
      return `${this.base}/health`;
    },
    get simplify(): string {
      return `${this.base}/simplify`;
    },
    get assessment(): string {
      return `${this.base}/generate-assessment`;
    },
    get pedagogicalEnrich(): string {
      return `${this.base}/api/pedagogical/enrich`;
    },
  },

  // API URL (for webhooks, callbacks)
  api: {
    base: getWithFallback("API_URL", "http://localhost:4000/api/v1"),

    get health(): string {
      return `${this.base}/health`;
    },
  },

  // OAuth Callback URLs
  oauth: {
    get google(): string {
      return (
        process.env.GOOGLE_CALLBACK_URL ||
        `${URL_CONFIG.api.base}/auth/google/callback`
      );
    },
    get microsoft(): string {
      return (
        process.env.MICROSOFT_CALLBACK_URL ||
        `${URL_CONFIG.api.base}/auth/microsoft/callback`
      );
    },
  },

  // Storage URL (for serving uploads)
  storage: {
    base: getWithFallback("STORAGE_BASE_URL", "http://localhost:3000"),
  },

  // CORS Origins
  get corsOrigins(): string[] {
    const origins = process.env.CORS_ORIGINS;
    if (origins) {
      return origins.split(",").map((o) => o.trim());
    }

    // Development defaults
    return IS_PRODUCTION
      ? [URL_CONFIG.frontend.base]
      : ["http://localhost:3000"];
  },
} as const;

/**
 * Export individual configs for convenience
 */
export const FRONTEND_URL = URL_CONFIG.frontend.base;
export const AI_SERVICE_URL = URL_CONFIG.ai.base;
export const API_URL = URL_CONFIG.api.base;

/**
 * Validate configuration on import (fails fast)
 */
if (IS_PRODUCTION) {
  try {
    // Access all required URLs to trigger validation
    const _ = [URL_CONFIG.frontend.base, URL_CONFIG.ai.base];
  } catch (error) {
    console.error("❌ URL Configuration validation failed:", error);
    process.exit(1);
  }
}

export default URL_CONFIG;
