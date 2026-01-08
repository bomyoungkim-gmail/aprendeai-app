/**
 * Policy Awareness Hook
 * 
 * Provides easy access to DecisionPolicyV1 gates for conditional UI rendering.
 * Uses safe defaults when policy is unavailable.
 * 
 * Admin Override: Admins/educators can bypass policy restrictions for testing/support.
 */

import { useMemo } from 'react';
import type { DecisionPolicyV1 } from '@/types/session';

interface UsePolicyOptions {
  policy?: DecisionPolicyV1;
  /**
   * User role for admin override
   * Admins and educators can see all features regardless of policy
   */
  userRole?: 'LEARNER' | 'EDUCATOR' | 'ADMIN' | 'PARENT';
  /**
   * Force enable all features (for testing)
   */
  forceEnableAll?: boolean;
}

interface PolicyGates {
  // Feature gates
  isTransferGraphEnabled: boolean;
  isSentenceAnalysisEnabled: boolean;
  isPkmEnabled: boolean;
  isGamesEnabled: boolean;
  isMissionFeedbackEnabled: boolean;
  isHuggingEnabled: boolean;
  
  // Extraction gates
  allowTextExtraction: boolean;
  allowOcr: boolean;
  
  // Scaffolding config
  masteryThresholds: {
    high: number;
    low: number;
    frustrationHigh: number;
  };
  adaptiveScaffolding: boolean;
  
  // Budgeting
  budgetStrategy: 'DETERMINISTIC_FIRST' | 'LLM_FIRST' | 'HYBRID';
  maxLlmCalls: number;
  
  // Limits
  maxSelectedTextChars: number;
  
  // Raw policy for advanced use
  policy?: DecisionPolicyV1;
  
  // Admin override flag
  isAdminOverride: boolean;
}

/**
 * Hook to access policy gates
 * 
 * @param options - Options including policy object, user role, and override flags
 * @returns Policy gates with safe defaults
 * 
 * @example
 * ```tsx
 * const { isTransferGraphEnabled, allowOcr, isAdminOverride } = usePolicy({ 
 *   policy: session?.decision_policy,
 *   userRole: user?.role
 * });
 * 
 * if (!isTransferGraphEnabled) {
 *   return null; // Hide transfer button
 * }
 * ```
 */
export function usePolicy(options: UsePolicyOptions = {}): PolicyGates {
  const { policy, userRole, forceEnableAll } = options;
  
  return useMemo(() => {
    // Admin override: Admins and educators can bypass all restrictions
    const isAdminOverride = forceEnableAll || userRole === 'ADMIN' || userRole === 'EDUCATOR';
    
    // Safe defaults:
    // - Features: enabled by default (optimistic)
    // - Extraction: disabled by default (conservative)
    const defaults = {
      isTransferGraphEnabled: true,
      isSentenceAnalysisEnabled: true,
      isPkmEnabled: true,
      isGamesEnabled: true,
      isMissionFeedbackEnabled: true,
      isHuggingEnabled: true,
      allowTextExtraction: false,
      allowOcr: false,
      masteryThresholds: {
        high: 0.8,
        low: 0.4,
        frustrationHigh: 0.7,
      },
      adaptiveScaffolding: true,
      budgetStrategy: 'DETERMINISTIC_FIRST' as const,
      maxLlmCalls: 10,
      maxSelectedTextChars: 900,
    };
    
    // If admin override, enable everything
    if (isAdminOverride) {
      return {
        ...defaults,
        // Override extraction to allow (for testing/support)
        allowTextExtraction: true,
        allowOcr: true,
        policy,
        isAdminOverride: true,
      };
    }
    
    if (!policy) {
      return { ...defaults, policy: undefined, isAdminOverride: false };
    }
    
    return {
      // Feature gates
      isTransferGraphEnabled: policy.features.transferGraphEnabled ?? defaults.isTransferGraphEnabled,
      isSentenceAnalysisEnabled: policy.features.sentenceAnalysisEnabled ?? defaults.isSentenceAnalysisEnabled,
      isPkmEnabled: policy.features.pkmEnabled ?? defaults.isPkmEnabled,
      isGamesEnabled: policy.features.gamesEnabled ?? defaults.isGamesEnabled,
      isMissionFeedbackEnabled: policy.features.missionFeedbackEnabled ?? defaults.isMissionFeedbackEnabled,
      isHuggingEnabled: policy.features.huggingEnabled ?? defaults.isHuggingEnabled,
      
      // Extraction gates
      allowTextExtraction: policy.extraction.allowTextExtraction ?? defaults.allowTextExtraction,
      allowOcr: policy.extraction.allowOcr ?? defaults.allowOcr,
      
      // Scaffolding
      masteryThresholds: {
        high: policy.scaffolding.thresholds.masteryHigh ?? defaults.masteryThresholds.high,
        low: policy.scaffolding.thresholds.masteryLow ?? defaults.masteryThresholds.low,
        frustrationHigh: policy.scaffolding.thresholds.frustrationHigh ?? defaults.masteryThresholds.frustrationHigh,
      },
      adaptiveScaffolding: policy.scaffolding.adaptiveScaffolding ?? defaults.adaptiveScaffolding,
      
      // Budgeting
      budgetStrategy: policy.budgeting.strategy ?? defaults.budgetStrategy,
      maxLlmCalls: policy.budgeting.maxLlmCallsPerSession ?? defaults.maxLlmCalls,
      
      // Limits
      maxSelectedTextChars: policy.limits.maxSelectedTextChars ?? defaults.maxSelectedTextChars,
      
      // Raw policy
      policy,
      isAdminOverride: false,
    };
  }, [policy, userRole, forceEnableAll]);
}
