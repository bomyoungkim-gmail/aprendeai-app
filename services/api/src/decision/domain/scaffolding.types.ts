/**
 * Scaffolding & Fading Types
 * 
 * Defines the state structures for learner mastery tracking and scaffolding level management.
 * These types are persisted in learner_profiles.mastery_state_json and scaffolding_state_json.
 */

/**
 * Mastery state for a specific domain (e.g., 'biology', 'physics')
 */
export interface DomainMastery {
  mastery: number; // 0.0-1.0
  lastEvidenceAt: string; // ISO Date
  missionHistory: Record<string, any>; // Track completed missions
  consistencyCount: number; // Number of consecutive sessions with evidence
}

/**
 * Complete mastery state structure
 * Etapa 1 — Estados de domínio e maestria
 */
export interface MasteryState {
  domains: Record<string, DomainMastery>;
  tier2: Record<string, number>; // Vocabulary mastery (0.0-1.0)
  morphology: Record<string, number>; // Prefix/Suffix mastery (0.0-1.0)
  errorPatterns?: Array<{
    topic: string;
    questionType: string;
    errorCount: number;
    lastOccurrence: string;
    questionText: string;
  }>; // SCRIPT 08: Track error patterns for targeted intervention
}

/**
 * Scaffolding level: 0=Fade, 1=Low, 2=Medium, 3=High
 */
export type ScaffoldingLevel = 0 | 1 | 2 | 3;

/**
 * Scaffolding state structure
 */
export interface ScaffoldingState {
  currentLevel: ScaffoldingLevel;
  lastLevelChangeAt: Date;
  overrideMode?: 'FORCE_HIGH' | 'FORCE_LOW'; // For debugging or teacher override
  fadingMetrics: {
    consecutiveSuccesses: number; // For fading engine
    interventionDismissalRate: number; // 0.0-1.0
  };
}

/**
 * Scaffolding configuration for a given level
 * Etapa 2 — Regras de Scaffolding (níveis 0–3)
 */
export interface ScaffoldingConfig {
  level: ScaffoldingLevel;
  name: 'Fade' | 'Low' | 'Medium' | 'High';
  behavior: string;
  rules: {
    doubtSpikeMultiplier: number; // Multiplier for doubt spike threshold
    checkpointFreqMultiplier: number; // Multiplier for checkpoint frequency
    autoHints: boolean | 'limited'; // Auto-show hints
    socraticMode: boolean; // Enable Socratic questioning
    showTriggers: boolean; // Show intervention triggers to user
    minAgentCalls: boolean; // Minimize agent calls (L0 only)
  };
}

/**
 * Mastery signal types for updating state
 */
export type MasterySignalType =
  | 'quiz_correct'
  | 'quiz_incorrect'
  | 'slow_read'
  | 'asked_for_help'
  | 'checkpoint_passed'
  | 'checkpoint_failed'
  | 'mission_completed';

/**
 * Signal for updating mastery state
 */
export interface MasterySignal {
  type: MasterySignalType;
  domain?: string;
  tier2Term?: string;
  morpheme?: string;
  value?: number; // Optional value (e.g., quiz score)
  timestamp: Date;
}

// ============================================================================
// SCRIPT 03: Mode-Aware Scaffolding & Fading
// ============================================================================

/**
 * Learner profile data for scaffolding initialization
 * 
 * Used by ScaffoldingInitializerService to determine initial scaffolding level
 * based on ContentMode and learner characteristics.
 */
export interface LearnerProfileForScaffolding {
  /** Whether this is a new user (no mastery history) */
  isNewUser: boolean;
  
  /** Average mastery across all domains (0.0-1.0) */
  avgMastery: number;
  
  /** Recent performance metric (0.0-1.0) */
  recentPerformance: number;
}

/**
 * Parameters for mode-aware scaffolding initialization
 * 
 * GAP 6: Includes policyOverride to respect institution-level settings.
 */
export interface ScaffoldingInitParams {
  /** Content mode (DIDACTIC, NARRATIVE, TECHNICAL, SCIENTIFIC, NEWS) */
  mode: import('@prisma/client').ContentMode;
  
  /** Learner profile data */
  learnerProfile: LearnerProfileForScaffolding;
  
  /** 
   * GAP 6: Policy override from decision_policy.scaffolding.defaultLevel
   * If provided and valid (0-3), takes precedence over mode-based logic.
   */
  policyOverride?: number;
}

/**
 * Signal types for scaffolding adjustment
 * 
 * SCRIPT 03 - Fase 2: Signal-Based Adjustment
 */
export type ScaffoldingSignalType = 'INCREASE' | 'DECREASE' | 'MAINTAIN';

/**
 * Signal detected from learner performance
 * 
 * Used by ScaffoldingSignalDetectorService to recommend scaffolding adjustments.
 */
export interface ScaffoldingSignal {
  /** Type of adjustment recommended */
  type: ScaffoldingSignalType;
  
  /** Reason for the signal (e.g., 'doubt_spike', 'consistent_mastery') */
  reason: string;
  
  /** Confidence level (0.0-1.0) */
  confidence: number;
  
  /** Evidence supporting the signal */
  evidence: {
    doubtSpike?: boolean;
    checkpointQuality?: number;
    quizAccuracy?: number;
    deepReadingIndex?: number;
    rehighlightRate?: number; // GAP 3: Rehighlight tracking
    consecutiveSessions?: number; // GAP 5: Consecutive sessions for fading
    flowScore?: number;
    flowIndicators?: any;
  };
}


