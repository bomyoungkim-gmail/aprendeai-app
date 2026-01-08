/**
 * Legacy Policy Migration
 * 
 * Maps old decision_policy_json keys to DecisionPolicyV1 format.
 * This is a one-time migration script to normalize existing policies.
 */

import { DecisionPolicyV1 } from './decision-policy.schema';

/**
 * Mapping of legacy keys to new schema paths
 */
const LEGACY_KEY_MAP: Record<string, string> = {
  // Features
  transferEnabled: 'features.transferGraphEnabled',
  sentenceAnalysisEnabled: 'features.sentenceAnalysisEnabled',
  pkmEnabled: 'features.pkmEnabled',
  gamesEnabled: 'features.gamesEnabled',
  
  // Extraction
  allow_text_extraction: 'extraction.allowTextExtraction',
  allowTextExtraction: 'extraction.allowTextExtraction',
  allow_ocr: 'extraction.allowOcr',
  selectionRequired: 'extraction.selectionRequiredForPdfImage',
  
  // Scaffolding
  fadingEnabled: 'scaffolding.fadingEnabled',
  T_mastery_hi: 'scaffolding.thresholds.masteryHigh',
  T_mastery_low: 'scaffolding.thresholds.masteryLow',
  T_consistency_hi: 'scaffolding.thresholds.consistencyHigh',
  cooldown_min_turns: 'scaffolding.thresholds.cooldownMinTurns',
  
  // Budgeting
  budget_strategy: 'budgeting.strategy',
  allowSmartTier: 'budgeting.allowSmartTier',
  
  // Limits
  max_selected_text_chars: 'limits.maxSelectedTextChars',
  max_chat_message_chars: 'limits.maxChatMessageChars',
  max_quick_replies: 'limits.maxQuickReplies',
  max_events_per_turn: 'limits.maxEventsToWritePerTurn',
};

/**
 * Set a nested value in an object using a path string
 * @param obj - Target object
 * @param path - Dot-separated path (e.g., "features.transferGraphEnabled")
 * @param value - Value to set
 */
function setNestedValue(obj: any, path: string, value: any): void {
  const keys = path.split('.');
  let current = obj;
  
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!current[key]) {
      current[key] = {};
    }
    current = current[key];
  }
  
  current[keys[keys.length - 1]] = value;
}

/**
 * Migrate legacy policy to DecisionPolicyV1 format
 * @param legacy - Legacy policy object with old keys
 * @returns Partial DecisionPolicyV1 with migrated values
 */
export function migrateLegacyPolicy(legacy: any): Partial<DecisionPolicyV1> {
  if (!legacy || typeof legacy !== 'object') {
    return {};
  }
  
  const migrated: any = { version: 1 };
  
  for (const [oldKey, newPath] of Object.entries(LEGACY_KEY_MAP)) {
    if (oldKey in legacy) {
      setNestedValue(migrated, newPath, legacy[oldKey]);
    }
  }
  
  return migrated;
}

/**
 * Check if a policy object uses legacy keys
 * @param policy - Policy object to check
 * @returns True if any legacy keys are found
 */
export function hasLegacyKeys(policy: any): boolean {
  if (!policy || typeof policy !== 'object') {
    return false;
  }
  
  return Object.keys(LEGACY_KEY_MAP).some(key => key in policy);
}
