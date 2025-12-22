/**
 * Request Context Management
 * 
 * Phase 0: Multi-Tenancy - Context Storage
 * Uses AsyncLocalStorage for thread-safe request context
 */

import { AsyncLocalStorage } from 'async_hooks';

export interface RequestContext {
  user: {
    id: string;
    institutionId: string;
    role: string;
    email: string;
  };
  correlationId: string;
  requestId: string;
}

const asyncLocalStorage = new AsyncLocalStorage<RequestContext>();

/**
 * Set context for current request (called by interceptor)
 */
export function setRequestContext(context: RequestContext): void {
  asyncLocalStorage.enterWith(context);
}

/**
 * Get current request context
 */
export function getRequestContext(): RequestContext | undefined {
  return asyncLocalStorage.getStore();
}

/**
 * Get current user from context
 */
export function getCurrentUser() {
  return getRequestContext()?.user;
}

/**
 * Get current institution ID
 */
export function getCurrentInstitutionId(): string | undefined {
  return getCurrentUser()?.institutionId;
}

/**
 * Get correlation ID for logging
 */
export function getCorrelationId(): string | undefined {
  return getRequestContext()?.correlationId;
}
