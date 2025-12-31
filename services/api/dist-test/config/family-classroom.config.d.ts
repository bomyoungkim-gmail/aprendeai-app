export declare const FAMILY_CONFIG: {
    readonly POLICY: {
        readonly DEFAULT_TIMEBOX_MIN: 15;
        readonly DEFAULT_DAILY_MIN_MINUTES: 15;
        readonly DEFAULT_DAILY_REVIEW_CAP: 20;
        readonly DEFAULT_PRIVACY_MODE: "AGGREGATED_ONLY";
    };
    readonly CO_READING: {
        readonly DEFAULT_TIMEBOX_MIN: 20;
        readonly PRE_PHASE_TIMEOUT_MIN: 2;
        readonly MAX_CHECKPOINT_FAILURES: 2;
    };
    readonly TEACH_BACK: {
        readonly DEFAULT_DURATION_MIN: 7;
        readonly MIN_DURATION_MIN: 5;
        readonly MAX_DURATION_MIN: 8;
        readonly MAX_STARS: 3;
    };
    readonly DASHBOARD: {
        readonly DEFAULT_COMPREHENSION_AVG: 75;
        readonly MAX_RECENT_SESSIONS: 30;
        readonly TREND_CALCULATION_WINDOW: 5;
    };
};
export declare const CLASSROOM_CONFIG: {
    readonly POLICY: {
        readonly DEFAULT_WEEKLY_UNITS_TARGET: 3;
        readonly DEFAULT_TIMEBOX_MIN: 20;
        readonly DEFAULT_DAILY_REVIEW_CAP: 30;
        readonly DEFAULT_PRIVACY_MODE: "AGGREGATED_ONLY";
        readonly DEFAULT_INTERVENTION_MODE: "PROMPT_COACH";
    };
    readonly DASHBOARD: {
        readonly MAX_STUDENTS_PER_PAGE: 50;
        readonly DEFAULT_COMPREHENSION_AVG: 70;
    };
    readonly INTERVENTIONS: {
        readonly HELP_REQUEST_TTL_HOURS: 24;
        readonly MAX_PENDING_REQUESTS: 10;
    };
};
