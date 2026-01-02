import { PedagogicalConfig } from './mode-configs';

export type InterventionType = 'CHECKPOINT' | 'SCAFFOLDING' | 'HINT' | 'RECAP';

export interface InterventionState {
  lastInterventionTime: number;
  interventionCount: number;
  dismissalCount: number;
  aggressivenessFactor: number;
}

export class InterventionManager {
  private state: InterventionState;

  constructor(
    private config: PedagogicalConfig,
    initialState?: Partial<InterventionState>
  ) {
    this.state = {
      lastInterventionTime: initialState?.lastInterventionTime || 0,
      interventionCount: initialState?.interventionCount || 0,
      dismissalCount: initialState?.dismissalCount || 0,
      aggressivenessFactor: initialState?.aggressivenessFactor || 1.0,
    };
  }

  /**
   * Core logic to decide if an intervention should be shown.
   * E1.1: Respect Flow
   * E1.2: Respect Cooldown
   * E1.3: Respect Session Limit
   */
  public shouldShowIntervention(
    isInFlow: boolean,
    currentTime: number = Date.now()
  ): boolean {
    // E1.1: Never interrupt flow
    if (isInFlow) return false;

    // E1.2: Check cooldown
    const timeSinceLast = currentTime - this.state.lastInterventionTime;
    if (timeSinceLast < this.config.interventionCooldownMs) return false;

    // E1.3: Check session limit (adapted by aggressiveness)
    const adaptedLimit = this.config.interventionMaxPerSession * this.state.aggressivenessFactor;
    if (this.state.interventionCount >= adaptedLimit) return false;

    return true;
  }

  /**
   * Updates state when an intervention is actually displayed.
   */
  public recordIntervention(currentTime: number = Date.now()): InterventionState {
    this.state.lastInterventionTime = currentTime;
    this.state.interventionCount += 1;
    return { ...this.state };
  }

  /**
   * E1.4: Adaptation - reduce aggressiveness if user dismisses prompts.
   */
  public recordDismissal(): InterventionState {
    this.state.dismissalCount += 1;
    
    // If user dismisses 2 consecutive interventions, reduce frequency
    if (this.state.dismissalCount >= 2) {
      this.state.aggressivenessFactor *= 0.5;
      this.state.dismissalCount = 0; // Reset for next cycle
    }
    
    return { ...this.state };
  }

  /**
   * Resets dismissal count if user interacts positively with an intervention.
   */
  public recordPositiveEngagement(): InterventionState {
    this.state.dismissalCount = 0;
    // Optionally restore some aggressiveness?
    // this.state.aggressivenessFactor = Math.min(1.0, this.state.aggressivenessFactor + 0.1);
    return { ...this.state };
  }

  public getState(): InterventionState {
    return { ...this.state };
  }
}
