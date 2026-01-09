/**
 * Decision Service Constants
 * 
 * Centralized constants for decision-making, flow detection, and scaffolding.
 * These values can be overridden via DecisionPolicyV1 for institution/family-specific tuning.
 */

// ============================================================================
// FLOW DETECTION THRESHOLDS
// ============================================================================

export const FLOW_THRESHOLDS = {
  /**
   * Threshold for detecting HIGH_FLOW state (0.0-1.0)
   * Score >= 0.7 indicates productive flow
   */
  HIGH_FLOW: 0.7,
  
  /**
   * Threshold for detecting LOW_FLOW state (0.0-1.0)
   * Score < 0.3 indicates struggling/erratic behavior
   */
  LOW_FLOW: 0.3,
} as const;

// ============================================================================
// READING VELOCITY THRESHOLDS (words per minute)
// ============================================================================

export const READING_VELOCITY_THRESHOLDS = {
  /**
   * NARRATIVE content (stories, novels)
   * Faster reading expected
   */
  NARRATIVE: 200,
  
  /**
   * DIDACTIC content (textbooks, educational material)
   * Moderate reading speed
   */
  DIDACTIC: 150,
  
  /**
   * TECHNICAL content (code, formulas, complex diagrams)
   * Slower reading expected
   */
  TECHNICAL: 100,
  
  /**
   * NEWS content (articles, blog posts)
   * Fastest reading expected
   */
  NEWS: 250,
  
  /**
   * Default threshold when mode is unknown
   */
  DEFAULT: 200,
} as const;

// ============================================================================
// FLOW SCORE WEIGHTS
// ============================================================================

export const FLOW_SCORE_WEIGHTS = {
  /**
   * Weight for reading velocity component (30%)
   */
  VELOCITY: 0.3,
  
  /**
   * Weight for absence of doubts component (30%)
   */
  DOUBTS: 0.3,
  
  /**
   * Weight for low rehighlight rate component (20%)
   */
  REHIGHLIGHT: 0.2,
  
  /**
   * Weight for session duration component (20%)
   */
  DURATION: 0.2,
} as const;

// ============================================================================
// SESSION DURATION THRESHOLDS (minutes)
// ============================================================================

export const SESSION_DURATION_THRESHOLDS = {
  /**
   * Minimum session duration to consider for flow detection
   */
  MIN_FOR_FLOW: 15,
  
  /**
   * Ideal session duration for sustained flow
   */
  IDEAL: 30,
} as const;

// ============================================================================
// REHIGHLIGHT THRESHOLDS
// ============================================================================

export const REHIGHLIGHT_THRESHOLDS = {
  /**
   * Low rehighlight rate (<10% is good)
   */
  LOW: 0.1,
  
  /**
   * High rehighlight rate (>30% indicates confusion)
   */
  HIGH: 0.3,
} as const;

// ============================================================================
// LOOKBACK WINDOWS (milliseconds)
// ============================================================================

export const LOOKBACK_WINDOWS = {
  /**
   * Window for flow state detection (10 minutes)
   */
  FLOW_DETECTION: 10 * 60 * 1000,
  
  /**
   * Window for doubt spike detection (90 seconds)
   */
  DOUBT_SPIKE: 90 * 1000,
  
  /**
   * Window for checkpoint quality analysis (5 minutes)
   */
  CHECKPOINT_QUALITY: 5 * 60 * 1000,
} as const;

// ============================================================================
// CACHE TTL (milliseconds)
// ============================================================================

export const CACHE_TTL = {
  /**
   * Decision result cache (10 seconds)
   */
  DECISION: 10 * 1000,
  
  /**
   * Flow state cache (2 minutes)
   */
  FLOW_STATE: 2 * 60 * 1000,
  
  /**
   * Scaffolding state cache (5 minutes)
   */
  SCAFFOLDING: 5 * 60 * 1000,
} as const;

// ============================================================================
// MASTERY THRESHOLDS
// ============================================================================

export const MASTERY_THRESHOLDS = {
  /**
   * Threshold for fading to L0 (no scaffolding)
   * Mastery >= 0.8
   */
  FADE: 0.8,
  
  /**
   * Threshold for L1 (minimal scaffolding)
   * Mastery >= 0.6
   */
  LOW: 0.6,
  
  /**
   * Threshold for L2 (moderate scaffolding)
   * Mastery >= 0.4
   */
  MEDIUM: 0.4,
  
  /**
   * Below this threshold: L3 (maximum scaffolding)
   * Mastery < 0.4
   */
} as const;

// ============================================================================
// SCAFFOLDING CONFIGURATION
// ============================================================================

export const SCAFFOLDING_CONFIG = {
  /**
   * Number of consecutive sessions with high mastery required for fading
   */
  CONSISTENCY_SESSIONS_REQUIRED: 3,
} as const;

// ============================================================================
// TYPE EXPORTS FOR TYPE SAFETY
// ============================================================================

export type FlowThreshold = typeof FLOW_THRESHOLDS[keyof typeof FLOW_THRESHOLDS];
export type ReadingVelocityThreshold = typeof READING_VELOCITY_THRESHOLDS[keyof typeof READING_VELOCITY_THRESHOLDS];
export type CacheTTL = typeof CACHE_TTL[keyof typeof CACHE_TTL];
export type MasteryThreshold = typeof MASTERY_THRESHOLDS[keyof typeof MASTERY_THRESHOLDS];
