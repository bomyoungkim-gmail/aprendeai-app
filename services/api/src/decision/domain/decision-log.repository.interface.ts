import { DecisionInput, DecisionOutput, DecisionResultV2 } from './decision.types';

/**
 * Repository interface for logging decisions
 * 
 * Following clean architecture: domain defines the contract,
 * infrastructure provides the implementation.
 */
export interface IDecisionLogRepository {
  /**
   * Log a decision to the database
   * 
   * @param decision - The decision output
   * @param context - The input context that led to this decision
   * @returns The created log entry ID
   */
  logDecision(
    decision: DecisionOutput,
    context: DecisionInput,
  ): Promise<string>;

  /**
   * Log a decision v2 with suppression tracking
   * 
   * @param result - The decision result v2
   * @param context - The input context that led to this decision
   * @returns The created log entry ID
   */
  logDecisionV2(
    result: DecisionResultV2,
    context: DecisionInput,
  ): Promise<string>;
}

export const IDecisionLogRepository = Symbol('IDecisionLogRepository');
