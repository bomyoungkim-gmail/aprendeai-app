import { z } from "zod";

// Base event schema
export const BaseEventSchema = z.object({
  domain: z.enum(["FAMILY", "CLASS"]),
  type: z.string(),
  data: z.record(z.string(), z.any()), // Fixed: record requires key and value types
});

// FAMILY Event Types
export const FamilyPolicySetSchema = z.object({
  domain: z.literal("FAMILY"),
  type: z.literal("FAMILY_POLICY_SET"),
  data: z.object({
    householdId: z.string(),
    learnerUserId: z.string(),
    policy: z.object({
      timeboxDefaultMin: z.number(),
      coReadingDays: z.array(z.number().min(0).max(6)),
      coReadingTime: z.string().optional(),
      toolWordsGateEnabled: z.boolean(),
      dailyMinMinutes: z.number(),
      dailyReviewCap: z.number(),
      privacyMode: z.enum(["AGGREGATED_ONLY", "AGGREGATED_PLUS_TRIGGERS"]),
    }),
  }),
});

export const CoSessionStartedSchema = z.object({
  domain: z.literal("FAMILY"),
  type: z.literal("CO_SESSION_STARTED"),
  data: z.object({
    householdId: z.string(),
    coSessionId: z.string(),
    learnerUserId: z.string(),
    educatorUserId: z.string(),
    readingSessionId: z.string(),
    contentId: z.string(),
    timeboxMin: z.number(),
  }),
});

export const CoSessionPhaseChangedSchema = z.object({
  domain: z.literal("FAMILY"),
  type: z.literal("CO_SESSION_PHASE_CHANGED"),
  data: z.object({
    coSessionId: z.string(),
    phase: z.enum(["BOOT", "PRE", "DURING", "POST", "CLOSE"]),
  }),
});

export const EducatorInterventionChosenSchema = z.object({
  domain: z.literal("FAMILY"),
  type: z.literal("EDUCATOR_INTERVENTION_CHOSEN"),
  data: z.object({
    coSessionId: z.string(),
    choice: z.enum(["A", "B", "C"]),
    reason: z.enum(["CHECKPOINT_FAIL_2X", "FRUSTRATION_HIGH", "TIMEBOX_SHORT"]),
    note: z.string().optional(),
  }),
});

export const FamilyAlertRaisedSchema = z.object({
  domain: z.literal("FAMILY"),
  type: z.literal("FAMILY_ALERT_RAISED"),
  data: z.object({
    householdId: z.string(),
    learnerUserId: z.string(),
    alertType: z.enum([
      "SLUMP",
      "LOW_COMPREHENSION",
      "HIGH_UNKNOWN_DENSITY",
      "STREAK_BROKEN",
    ]),
    severity: z.enum(["LOW", "MED", "HIGH"]),
    windowDays: z.number(),
    metrics: z.object({
      compAvg: z.number(),
      unknownDensity: z.number(),
      streak: z.number(),
    }),
  }),
});

export const CoSessionFinishedSchema = z.object({
  domain: z.literal("FAMILY"),
  type: z.literal("CO_SESSION_FINISHED"),
  data: z.object({
    coSessionId: z.string(),
    result: z.enum(["COMPLETED", "ABORTED", "TIMEOUT"]),
    durationMin: z.number(),
    summary: z.object({
      targetWordsCount: z.number(),
      checkpointCount: z.number(),
      checkpointFailCount: z.number(),
      productionSubmitted: z.boolean(),
    }),
  }),
});

// CLASS Event Types
export const ClassPolicySetSchema = z.object({
  domain: z.literal("CLASS"),
  type: z.literal("CLASS_POLICY_SET"),
  data: z.object({
    classroomId: z.string(),
    policy: z.object({
      weeklyUnitsTarget: z.number(),
      timeboxDefaultMin: z.number(),
      toolWordsGateEnabled: z.boolean(),
      dailyReviewCap: z.number(),
      privacyMode: z.enum([
        "AGGREGATED_ONLY",
        "AGGREGATED_PLUS_HELP_REQUESTS",
        "AGGREGATED_PLUS_FLAGS",
      ]),
      interventionMode: z.enum(["PROMPT_COACH", "PROMPT_COACH_PLUS_1ON1"]),
    }),
  }),
});

export const ClassWeeklyPlanCreatedSchema = z.object({
  domain: z.literal("CLASS"),
  type: z.literal("CLASS_WEEKLY_PLAN_CREATED"),
  data: z.object({
    classroomId: z.string(),
    weekStart: z.string(),
    itemCount: z.number(),
    toolWordCount: z.number(),
  }),
});

export const ClassAlertRaisedSchema = z.object({
  domain: z.literal("CLASS"),
  type: z.literal("CLASS_ALERT_RAISED"),
  data: z.object({
    classroomId: z.string(),
    learnerUserId: z.string(),
    alertType: z.enum(["HELP_REQUEST", "SLUMP", "LOW_ENGAGEMENT"]),
    severity: z.enum(["LOW", "MED", "HIGH"]),
  }),
});

// Export all event schemas
export const EventSchemas = {
  FAMILY_POLICY_SET: FamilyPolicySetSchema,
  CO_SESSION_STARTED: CoSessionStartedSchema,
  CO_SESSION_PHASE_CHANGED: CoSessionPhaseChangedSchema,
  EDUCATOR_INTERVENTION_CHOSEN: EducatorInterventionChosenSchema,
  FAMILY_ALERT_RAISED: FamilyAlertRaisedSchema,
  CO_SESSION_FINISHED: CoSessionFinishedSchema,
  CLASS_POLICY_SET: ClassPolicySetSchema,
  CLASS_WEEKLY_PLAN_CREATED: ClassWeeklyPlanCreatedSchema,
  CLASS_ALERT_RAISED: ClassAlertRaisedSchema,
};

export type FamilyPolicySetEvent = z.infer<typeof FamilyPolicySetSchema>;
export type CoSessionStartedEvent = z.infer<typeof CoSessionStartedSchema>;
export type CoSessionPhaseChangedEvent = z.infer<
  typeof CoSessionPhaseChangedSchema
>;
export type EducatorInterventionChosenEvent = z.infer<
  typeof EducatorInterventionChosenSchema
>;
export type FamilyAlertRaisedEvent = z.infer<typeof FamilyAlertRaisedSchema>;
export type CoSessionFinishedEvent = z.infer<typeof CoSessionFinishedSchema>;
export type ClassPolicySetEvent = z.infer<typeof ClassPolicySetSchema>;
export type ClassWeeklyPlanCreatedEvent = z.infer<
  typeof ClassWeeklyPlanCreatedSchema
>;
export type ClassAlertRaisedEvent = z.infer<typeof ClassAlertRaisedSchema>;
