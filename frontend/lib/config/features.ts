/**
 * Feature Flags Configuration
 * 
 * Controls which architectural features are enabled.
 * Can be toggled via environment variables for instant rollback.
 */

// ========================================
// FEATURE FLAGS
// ========================================

export const features = {
  /**
   * Use new services layer for business logic
   * When false: hooks use direct API calls (legacy)
   * When true: hooks use services layer
   */
  useServices: process.env.NEXT_PUBLIC_USE_SERVICES === 'true',

  /**
   * Use refactored hooks with services
   * When false: use legacy hook implementations
   * When true: use new hook implementations
   */
  useNewHooks: process.env.NEXT_PUBLIC_USE_NEW_HOOKS === 'true',

  /**
   * Use centralized storage service
   * When false: direct localStorage access
   * When true: use storageService abstraction
   */
  useStorageService: process.env.NEXT_PUBLIC_USE_STORAGE === 'true',

  /**
   * Use WebSocket singleton service
   * When false: use WebSocketContext
   * When true: use websocketService
   */
  useWebSocketService: process.env.NEXT_PUBLIC_USE_WS_SERVICE === 'true',

  /**
   * Use new offline queue service
   * When false: use lib/cornell/offline-queue
   * When true: use services/cornell/offline-queue.service
   */
  useOfflineQueueService: process.env.NEXT_PUBLIC_USE_OFFLINE_QUEUE === 'true',
} as const;

// ========================================
// HELPERS
// ========================================

/**
 * Check if a specific feature is enabled
 */
export function useFeature(name: keyof typeof features): boolean {
  return features[name];
}

/**
 * Get all enabled features (for debugging)
 */
export function getEnabledFeatures(): string[] {
  return Object.entries(features)
    .filter(([_, enabled]) => enabled)
    .map(([name]) => name);
}

/**
 * Get all feature flags status (for debugging)
 */
export function getAllFeatures(): typeof features {
  return features;
}

// ========================================
// TYPES
// ========================================

export type FeatureName = keyof typeof features;

// ========================================
// DEVELOPMENT HELPERS
// ========================================

if (process.env.NODE_ENV === 'development') {
  // Log enabled features in console (dev only)
  const enabled = getEnabledFeatures();
  if (enabled.length > 0) {
    console.log('🚩 Feature Flags Enabled:', enabled.join(', '));
  }
}
