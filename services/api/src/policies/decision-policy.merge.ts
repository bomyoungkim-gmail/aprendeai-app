import {
  DecisionPolicyV1Schema,
  DecisionPolicyV1,
} from "./decision-policy.schema";

/**
 * Deep merge two objects (b overrides a)
 */
function deepMerge(a: any, b: any): any {
  const out = { ...a };
  for (const key in b) {
    if (
      b[key] !== null &&
      typeof b[key] === "object" &&
      !Array.isArray(b[key])
    ) {
      out[key] = deepMerge(out[key] || {}, b[key]);
    } else {
      out[key] = b[key];
    }
  }
  return out;
}

/**
 * Merge decision policies from multiple scopes.
 *
 * Hierarchy: GLOBAL < INSTITUTION < FAMILY
 * Later policies override earlier ones (deep merge).
 *
 * @param policies - Policies to merge, in order of precedence (lowest to highest)
 * @returns Merged and re-validated DecisionPolicyV1
 */
export function mergeDecisionPolicies(
  ...policies: DecisionPolicyV1[]
): DecisionPolicyV1 {
  if (policies.length === 0) {
    return DecisionPolicyV1Schema.parse({});
  }

  let merged = policies[0];
  for (let i = 1; i < policies.length; i++) {
    merged = deepMerge(merged, policies[i]);
  }

  // Re-parse to ensure defaults and coercion are applied
  return DecisionPolicyV1Schema.parse(merged);
}
