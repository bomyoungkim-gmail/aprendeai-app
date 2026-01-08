import { Logger } from '@nestjs/common';
import { DecisionPolicyV1Schema, DecisionPolicyV1 } from './decision-policy.schema';

const logger = new Logger('DecisionPolicyParser');

/**
 * Parse and validate decision_policy_json with fallback to defaults.
 * 
 * @param raw - Raw JSON object from database
 * @param contextLabel - Context label for logging (e.g., "INSTITUTION:abc123")
 * @returns Validated DecisionPolicyV1 with all defaults applied
 */
export function parseDecisionPolicy(
  raw: unknown,
  contextLabel: string,
): DecisionPolicyV1 {
  const result = DecisionPolicyV1Schema.safeParse(raw ?? {});
  
  if (!result.success) {
    logger.warn(
      {
        contextLabel,
        issues: result.error.issues,
      },
      'Invalid decision_policy_json; using defaults',
    );
    return DecisionPolicyV1Schema.parse({});
  }
  
  return result.data;
}
