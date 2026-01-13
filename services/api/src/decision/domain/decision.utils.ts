/**
 * Decision Utilities
 *
 * Helper functions for resolving decision thresholds with policy overrides.
 * Implements fallback logic: policy override → centralized default
 *
 * Phase 2: Policy Integration
 */

import { DecisionPolicyV1 } from "./decision.types";
import {
  FLOW_THRESHOLDS,
  MASTERY_THRESHOLDS,
  SCAFFOLDING_CONFIG,
  READING_VELOCITY_THRESHOLDS,
  SESSION_DURATION_THRESHOLDS,
  REHIGHLIGHT_THRESHOLDS,
} from "./decision.constants";

/**
 * Resolve flow thresholds with policy overrides
 * Falls back to centralized constants if not overridden
 *
 * @param policy - Optional policy configuration
 * @returns Resolved flow thresholds
 */
export function resolveFlowThresholds(policy?: DecisionPolicyV1) {
  return {
    highFlow: policy?.flowThresholds?.highFlow ?? FLOW_THRESHOLDS.HIGH_FLOW,
    lowFlow: policy?.flowThresholds?.lowFlow ?? FLOW_THRESHOLDS.LOW_FLOW,
  };
}

/**
 * Resolve mastery thresholds with policy overrides
 *
 * @param policy - Optional policy configuration
 * @returns Resolved mastery thresholds
 */
export function resolveMasteryThresholds(policy?: DecisionPolicyV1) {
  return {
    fade: policy?.masteryThresholds?.fade ?? MASTERY_THRESHOLDS.FADE,
    low: policy?.masteryThresholds?.low ?? MASTERY_THRESHOLDS.LOW,
    medium: policy?.masteryThresholds?.medium ?? MASTERY_THRESHOLDS.MEDIUM,
  };
}

/**
 * Resolve scaffolding config with policy overrides
 *
 * @param policy - Optional policy configuration
 * @returns Resolved scaffolding configuration
 */
export function resolveScaffoldingConfig(policy?: DecisionPolicyV1) {
  return {
    consistencySessionsRequired:
      policy?.scaffoldingConfig?.consistencySessionsRequired ??
      SCAFFOLDING_CONFIG.CONSISTENCY_SESSIONS_REQUIRED,
  };
}

/**
 * Resolve all decision thresholds at once
 * Useful for comprehensive policy application
 *
 * @param policy - Optional policy configuration
 * @returns All resolved thresholds
 */
export function resolveAllThresholds(policy?: DecisionPolicyV1) {
  return {
    flow: resolveFlowThresholds(policy),
    mastery: resolveMasteryThresholds(policy),
    scaffolding: resolveScaffoldingConfig(policy),
    // Non-overridable constants (for reference)
    readingVelocity: READING_VELOCITY_THRESHOLDS,
    sessionDuration: SESSION_DURATION_THRESHOLDS,
    rehighlight: REHIGHLIGHT_THRESHOLDS,
  };
}

/**
 * Validate that policy thresholds are logically consistent
 *
 * @param policy - Policy to validate
 * @returns Validation result with errors if any
 */
export function validatePolicyThresholds(policy: DecisionPolicyV1): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Validate flow thresholds ordering: high > low
  if (policy.flowThresholds) {
    const { highFlow, lowFlow } = policy.flowThresholds;

    if (
      highFlow !== undefined &&
      lowFlow !== undefined &&
      highFlow <= lowFlow
    ) {
      errors.push("flowThresholds.highFlow must be greater than lowFlow");
    }
  }

  // Validate mastery thresholds ordering: fade > low > medium
  if (policy.masteryThresholds) {
    const { fade, low, medium } = policy.masteryThresholds;

    if (fade !== undefined && low !== undefined && fade <= low) {
      errors.push("masteryThresholds.fade must be greater than low");
    }

    if (low !== undefined && medium !== undefined && low <= medium) {
      errors.push("masteryThresholds.low must be greater than medium");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
