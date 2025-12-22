/**
 * Family Mode Configuration
 * Centralized configuration for Family Mode features
 */

export const FAMILY_CONFIG = {
  // Policy Defaults
  POLICY: {
    DEFAULT_TIMEBOX_MIN: 15,
    DEFAULT_DAILY_MIN_MINUTES: 15,
    DEFAULT_DAILY_REVIEW_CAP: 20,
    DEFAULT_PRIVACY_MODE: 'AGGREGATED_ONLY' as const,
  },

  // Co-Reading Session
  CO_READING: {
    DEFAULT_TIMEBOX_MIN: 20,
    PRE_PHASE_TIMEOUT_MIN: 2,
    MAX_CHECKPOINT_FAILURES: 2,
  },

  // Teach-Back
  TEACH_BACK: {
    DEFAULT_DURATION_MIN: 7,
    MIN_DURATION_MIN: 5,
    MAX_DURATION_MIN: 8,
    MAX_STARS: 3,
  },

  // Dashboard
  DASHBOARD: {
    DEFAULT_COMPREHENSION_AVG: 75, // Fallback when no data
    MAX_RECENT_SESSIONS: 30,
    TREND_CALCULATION_WINDOW: 5, // Sessions for trend analysis
  },
} as const;

/**
 * Classroom Mode Configuration
 * Centralized configuration for Classroom Mode features
 */

export const CLASSROOM_CONFIG = {
  // Policy Defaults
  POLICY: {
    DEFAULT_WEEKLY_UNITS_TARGET: 3,
    DEFAULT_TIMEBOX_MIN: 20,
    DEFAULT_DAILY_REVIEW_CAP: 30,
    DEFAULT_PRIVACY_MODE: 'AGGREGATED_ONLY' as const,
    DEFAULT_INTERVENTION_MODE: 'PROMPT_COACH' as const,
  },

  // Dashboard
  DASHBOARD: {
    MAX_STUDENTS_PER_PAGE: 50,
    DEFAULT_COMPREHENSION_AVG: 70,
  },

  // Interventions
  INTERVENTIONS: {
    HELP_REQUEST_TTL_HOURS: 24, // How long before a help request expires
    MAX_PENDING_REQUESTS: 10,
  },
} as const;
