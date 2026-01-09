/**
 * Decision Suppression Logic
 * 
 * Centralized suppression reason codes and helpers for DecisionService.
 * Ensures consistent auditability and prevents divergence between service, tests, and dashboards.
 */

/**
 * Standardized suppression reason codes.
 * These match the Prisma enum `SuppressReason`.
 */
export enum SuppressReason {
  POLICY_DISABLED = 'POLICY_DISABLED',
  BUDGET_EXCEEDED = 'BUDGET_EXCEEDED',
  RATE_LIMITED = 'RATE_LIMITED',
  COOLDOWN_ACTIVE = 'COOLDOWN_ACTIVE',
  PHASE_DURING_INVISIBLE = 'PHASE_DURING_INVISIBLE',
  LOW_FLOW_SILENCE = 'LOW_FLOW_SILENCE',
  HIGH_FLOW_PRESERVE = 'HIGH_FLOW_PRESERVE', // GAP 8: Suppress during productive flow
  SAFETY_GUARD = 'SAFETY_GUARD',
  MISSING_INPUTS = 'MISSING_INPUTS',
  DEGRADED_CAPABILITY = 'DEGRADED_CAPABILITY',
}

/**
 * Context for determining suppression reasons.
 * All flags should be set before calling computeSuppressReasons.
 */
export type SuppressionContext = {
  phase: 'DURING' | 'POST';
  explicitAsk: boolean;
  lowFlow: boolean;
  isInHighFlow: boolean; // GAP 8: HIGH_FLOW state detection
  cooldownActive: boolean;
  policyTransferEnabled: boolean;
  llmEnabled: boolean;
  budgetExceeded: boolean;
  rateLimited: boolean;
  missingInputs: boolean;
  safetyGuardTriggered: boolean;
  degradedCapability: boolean; // e.g., LLM -> DETERMINISTIC
};

/**
 * Compute suppression reasons based on context.
 * 
 * Order of checks (hard blocks first):
 * 1. Safety / Missing / Policy
 * 2. Phase / UX
 * 3. Flow / Behavior
 * 4. Capacity / Cost
 * 5. Degradation
 * 
 * @param ctx - Suppression context
 * @returns Array of unique suppression reasons in priority order
 */
export function computeSuppressReasons(ctx: SuppressionContext): SuppressReason[] {
  const reasons: SuppressReason[] = [];

  // 1. Hard blocks (safety, missing inputs, policy)
  if (ctx.safetyGuardTriggered) reasons.push(SuppressReason.SAFETY_GUARD);
  if (ctx.missingInputs) reasons.push(SuppressReason.MISSING_INPUTS);
  if (!ctx.policyTransferEnabled) reasons.push(SuppressReason.POLICY_DISABLED);

  // 2. Phase / UX (DURING phase without explicit ask)
  if (ctx.phase === 'DURING' && !ctx.explicitAsk) {
    reasons.push(SuppressReason.PHASE_DURING_INVISIBLE);
  }

  // 3. Flow / Behavior
  if (ctx.lowFlow) reasons.push(SuppressReason.LOW_FLOW_SILENCE);
  if (ctx.isInHighFlow && !ctx.explicitAsk) reasons.push(SuppressReason.HIGH_FLOW_PRESERVE); // GAP 8
  if (ctx.cooldownActive) reasons.push(SuppressReason.COOLDOWN_ACTIVE);

  // 4. Capacity / Cost
  if (!ctx.llmEnabled && !ctx.policyTransferEnabled) {
    // Already added POLICY_DISABLED above, avoid duplicate
  } else if (!ctx.llmEnabled) {
    reasons.push(SuppressReason.POLICY_DISABLED);
  }
  if (ctx.budgetExceeded) reasons.push(SuppressReason.BUDGET_EXCEEDED);
  if (ctx.rateLimited) reasons.push(SuppressReason.RATE_LIMITED);

  // 5. Degradation (when action stays but channel downgrades)
  if (ctx.degradedCapability) reasons.push(SuppressReason.DEGRADED_CAPABILITY);

  // Deduplicate while maintaining order
  return Array.from(new Set(reasons));
}

/**
 * Determine if an action was suppressed.
 * 
 * @param candidateAction - Proposed action from heuristics
 * @param finalAction - Final action after enforcement
 * @param reasons - Suppression reasons
 * @returns True if action changed or reasons exist
 */
export function isSuppressed(
  candidateAction: string,
  finalAction: string,
  reasons: SuppressReason[],
): boolean {
  return candidateAction !== finalAction || reasons.length > 0;
}
