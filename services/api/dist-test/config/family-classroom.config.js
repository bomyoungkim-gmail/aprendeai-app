"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CLASSROOM_CONFIG = exports.FAMILY_CONFIG = void 0;
exports.FAMILY_CONFIG = {
    POLICY: {
        DEFAULT_TIMEBOX_MIN: 15,
        DEFAULT_DAILY_MIN_MINUTES: 15,
        DEFAULT_DAILY_REVIEW_CAP: 20,
        DEFAULT_PRIVACY_MODE: "AGGREGATED_ONLY",
    },
    CO_READING: {
        DEFAULT_TIMEBOX_MIN: 20,
        PRE_PHASE_TIMEOUT_MIN: 2,
        MAX_CHECKPOINT_FAILURES: 2,
    },
    TEACH_BACK: {
        DEFAULT_DURATION_MIN: 7,
        MIN_DURATION_MIN: 5,
        MAX_DURATION_MIN: 8,
        MAX_STARS: 3,
    },
    DASHBOARD: {
        DEFAULT_COMPREHENSION_AVG: 75,
        MAX_RECENT_SESSIONS: 30,
        TREND_CALCULATION_WINDOW: 5,
    },
};
exports.CLASSROOM_CONFIG = {
    POLICY: {
        DEFAULT_WEEKLY_UNITS_TARGET: 3,
        DEFAULT_TIMEBOX_MIN: 20,
        DEFAULT_DAILY_REVIEW_CAP: 30,
        DEFAULT_PRIVACY_MODE: "AGGREGATED_ONLY",
        DEFAULT_INTERVENTION_MODE: "PROMPT_COACH",
    },
    DASHBOARD: {
        MAX_STUDENTS_PER_PAGE: 50,
        DEFAULT_COMPREHENSION_AVG: 70,
    },
    INTERVENTIONS: {
        HELP_REQUEST_TTL_HOURS: 24,
        MAX_PENDING_REQUESTS: 10,
    },
};
//# sourceMappingURL=family-classroom.config.js.map