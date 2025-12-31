"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventSchemas = exports.ClassAlertRaisedSchema = exports.ClassWeeklyPlanCreatedSchema = exports.ClassPolicySetSchema = exports.CoSessionFinishedSchema = exports.FamilyAlertRaisedSchema = exports.EducatorInterventionChosenSchema = exports.CoSessionPhaseChangedSchema = exports.CoSessionStartedSchema = exports.FamilyPolicySetSchema = exports.BaseEventSchema = void 0;
const zod_1 = require("zod");
exports.BaseEventSchema = zod_1.z.object({
    domain: zod_1.z.enum(["FAMILY", "CLASS"]),
    type: zod_1.z.string(),
    data: zod_1.z.record(zod_1.z.string(), zod_1.z.any()),
});
exports.FamilyPolicySetSchema = zod_1.z.object({
    domain: zod_1.z.literal("FAMILY"),
    type: zod_1.z.literal("FAMILY_POLICY_SET"),
    data: zod_1.z.object({
        householdId: zod_1.z.string(),
        learnerUserId: zod_1.z.string(),
        policy: zod_1.z.object({
            timeboxDefaultMin: zod_1.z.number(),
            coReadingDays: zod_1.z.array(zod_1.z.number().min(0).max(6)),
            coReadingTime: zod_1.z.string().optional(),
            toolWordsGateEnabled: zod_1.z.boolean(),
            dailyMinMinutes: zod_1.z.number(),
            dailyReviewCap: zod_1.z.number(),
            privacyMode: zod_1.z.enum(["AGGREGATED_ONLY", "AGGREGATED_PLUS_TRIGGERS"]),
        }),
    }),
});
exports.CoSessionStartedSchema = zod_1.z.object({
    domain: zod_1.z.literal("FAMILY"),
    type: zod_1.z.literal("CO_SESSION_STARTED"),
    data: zod_1.z.object({
        householdId: zod_1.z.string(),
        coSessionId: zod_1.z.string(),
        learnerUserId: zod_1.z.string(),
        educatorUserId: zod_1.z.string(),
        readingSessionId: zod_1.z.string(),
        contentId: zod_1.z.string(),
        timeboxMin: zod_1.z.number(),
    }),
});
exports.CoSessionPhaseChangedSchema = zod_1.z.object({
    domain: zod_1.z.literal("FAMILY"),
    type: zod_1.z.literal("CO_SESSION_PHASE_CHANGED"),
    data: zod_1.z.object({
        coSessionId: zod_1.z.string(),
        phase: zod_1.z.enum(["BOOT", "PRE", "DURING", "POST", "CLOSE"]),
    }),
});
exports.EducatorInterventionChosenSchema = zod_1.z.object({
    domain: zod_1.z.literal("FAMILY"),
    type: zod_1.z.literal("EDUCATOR_INTERVENTION_CHOSEN"),
    data: zod_1.z.object({
        coSessionId: zod_1.z.string(),
        choice: zod_1.z.enum(["A", "B", "C"]),
        reason: zod_1.z.enum(["CHECKPOINT_FAIL_2X", "FRUSTRATION_HIGH", "TIMEBOX_SHORT"]),
        note: zod_1.z.string().optional(),
    }),
});
exports.FamilyAlertRaisedSchema = zod_1.z.object({
    domain: zod_1.z.literal("FAMILY"),
    type: zod_1.z.literal("FAMILY_ALERT_RAISED"),
    data: zod_1.z.object({
        householdId: zod_1.z.string(),
        learnerUserId: zod_1.z.string(),
        alertType: zod_1.z.enum([
            "SLUMP",
            "LOW_COMPREHENSION",
            "HIGH_UNKNOWN_DENSITY",
            "STREAK_BROKEN",
        ]),
        severity: zod_1.z.enum(["LOW", "MED", "HIGH"]),
        windowDays: zod_1.z.number(),
        metrics: zod_1.z.object({
            compAvg: zod_1.z.number(),
            unknownDensity: zod_1.z.number(),
            streak: zod_1.z.number(),
        }),
    }),
});
exports.CoSessionFinishedSchema = zod_1.z.object({
    domain: zod_1.z.literal("FAMILY"),
    type: zod_1.z.literal("CO_SESSION_FINISHED"),
    data: zod_1.z.object({
        coSessionId: zod_1.z.string(),
        result: zod_1.z.enum(["COMPLETED", "ABORTED", "TIMEOUT"]),
        durationMin: zod_1.z.number(),
        summary: zod_1.z.object({
            targetWordsCount: zod_1.z.number(),
            checkpointCount: zod_1.z.number(),
            checkpointFailCount: zod_1.z.number(),
            productionSubmitted: zod_1.z.boolean(),
        }),
    }),
});
exports.ClassPolicySetSchema = zod_1.z.object({
    domain: zod_1.z.literal("CLASS"),
    type: zod_1.z.literal("CLASS_POLICY_SET"),
    data: zod_1.z.object({
        classroomId: zod_1.z.string(),
        policy: zod_1.z.object({
            weeklyUnitsTarget: zod_1.z.number(),
            timeboxDefaultMin: zod_1.z.number(),
            toolWordsGateEnabled: zod_1.z.boolean(),
            dailyReviewCap: zod_1.z.number(),
            privacyMode: zod_1.z.enum([
                "AGGREGATED_ONLY",
                "AGGREGATED_PLUS_HELP_REQUESTS",
                "AGGREGATED_PLUS_FLAGS",
            ]),
            interventionMode: zod_1.z.enum(["PROMPT_COACH", "PROMPT_COACH_PLUS_1ON1"]),
        }),
    }),
});
exports.ClassWeeklyPlanCreatedSchema = zod_1.z.object({
    domain: zod_1.z.literal("CLASS"),
    type: zod_1.z.literal("CLASS_WEEKLY_PLAN_CREATED"),
    data: zod_1.z.object({
        classroomId: zod_1.z.string(),
        weekStart: zod_1.z.string(),
        itemCount: zod_1.z.number(),
        toolWordCount: zod_1.z.number(),
    }),
});
exports.ClassAlertRaisedSchema = zod_1.z.object({
    domain: zod_1.z.literal("CLASS"),
    type: zod_1.z.literal("CLASS_ALERT_RAISED"),
    data: zod_1.z.object({
        classroomId: zod_1.z.string(),
        learnerUserId: zod_1.z.string(),
        alertType: zod_1.z.enum(["HELP_REQUEST", "SLUMP", "LOW_ENGAGEMENT"]),
        severity: zod_1.z.enum(["LOW", "MED", "HIGH"]),
    }),
});
exports.EventSchemas = {
    FAMILY_POLICY_SET: exports.FamilyPolicySetSchema,
    CO_SESSION_STARTED: exports.CoSessionStartedSchema,
    CO_SESSION_PHASE_CHANGED: exports.CoSessionPhaseChangedSchema,
    EDUCATOR_INTERVENTION_CHOSEN: exports.EducatorInterventionChosenSchema,
    FAMILY_ALERT_RAISED: exports.FamilyAlertRaisedSchema,
    CO_SESSION_FINISHED: exports.CoSessionFinishedSchema,
    CLASS_POLICY_SET: exports.ClassPolicySetSchema,
    CLASS_WEEKLY_PLAN_CREATED: exports.ClassWeeklyPlanCreatedSchema,
    CLASS_ALERT_RAISED: exports.ClassAlertRaisedSchema,
};
//# sourceMappingURL=event-schemas.js.map