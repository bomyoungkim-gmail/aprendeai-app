import { z } from "zod";
export declare const BaseEventSchema: z.ZodObject<{
    domain: z.ZodEnum<{
        FAMILY: "FAMILY";
        CLASS: "CLASS";
    }>;
    type: z.ZodString;
    data: z.ZodRecord<z.ZodString, z.ZodAny>;
}, z.core.$strip>;
export declare const FamilyPolicySetSchema: z.ZodObject<{
    domain: z.ZodLiteral<"FAMILY">;
    type: z.ZodLiteral<"FAMILY_POLICY_SET">;
    data: z.ZodObject<{
        householdId: z.ZodString;
        learnerUserId: z.ZodString;
        policy: z.ZodObject<{
            timeboxDefaultMin: z.ZodNumber;
            coReadingDays: z.ZodArray<z.ZodNumber>;
            coReadingTime: z.ZodOptional<z.ZodString>;
            toolWordsGateEnabled: z.ZodBoolean;
            dailyMinMinutes: z.ZodNumber;
            dailyReviewCap: z.ZodNumber;
            privacyMode: z.ZodEnum<{
                AGGREGATED_ONLY: "AGGREGATED_ONLY";
                AGGREGATED_PLUS_TRIGGERS: "AGGREGATED_PLUS_TRIGGERS";
            }>;
        }, z.core.$strip>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const CoSessionStartedSchema: z.ZodObject<{
    domain: z.ZodLiteral<"FAMILY">;
    type: z.ZodLiteral<"CO_SESSION_STARTED">;
    data: z.ZodObject<{
        householdId: z.ZodString;
        coSessionId: z.ZodString;
        learnerUserId: z.ZodString;
        educatorUserId: z.ZodString;
        readingSessionId: z.ZodString;
        contentId: z.ZodString;
        timeboxMin: z.ZodNumber;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const CoSessionPhaseChangedSchema: z.ZodObject<{
    domain: z.ZodLiteral<"FAMILY">;
    type: z.ZodLiteral<"CO_SESSION_PHASE_CHANGED">;
    data: z.ZodObject<{
        coSessionId: z.ZodString;
        phase: z.ZodEnum<{
            POST: "POST";
            PRE: "PRE";
            DURING: "DURING";
            BOOT: "BOOT";
            CLOSE: "CLOSE";
        }>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const EducatorInterventionChosenSchema: z.ZodObject<{
    domain: z.ZodLiteral<"FAMILY">;
    type: z.ZodLiteral<"EDUCATOR_INTERVENTION_CHOSEN">;
    data: z.ZodObject<{
        coSessionId: z.ZodString;
        choice: z.ZodEnum<{
            A: "A";
            B: "B";
            C: "C";
        }>;
        reason: z.ZodEnum<{
            CHECKPOINT_FAIL_2X: "CHECKPOINT_FAIL_2X";
            FRUSTRATION_HIGH: "FRUSTRATION_HIGH";
            TIMEBOX_SHORT: "TIMEBOX_SHORT";
        }>;
        note: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const FamilyAlertRaisedSchema: z.ZodObject<{
    domain: z.ZodLiteral<"FAMILY">;
    type: z.ZodLiteral<"FAMILY_ALERT_RAISED">;
    data: z.ZodObject<{
        householdId: z.ZodString;
        learnerUserId: z.ZodString;
        alertType: z.ZodEnum<{
            SLUMP: "SLUMP";
            LOW_COMPREHENSION: "LOW_COMPREHENSION";
            HIGH_UNKNOWN_DENSITY: "HIGH_UNKNOWN_DENSITY";
            STREAK_BROKEN: "STREAK_BROKEN";
        }>;
        severity: z.ZodEnum<{
            LOW: "LOW";
            MED: "MED";
            HIGH: "HIGH";
        }>;
        windowDays: z.ZodNumber;
        metrics: z.ZodObject<{
            compAvg: z.ZodNumber;
            unknownDensity: z.ZodNumber;
            streak: z.ZodNumber;
        }, z.core.$strip>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const CoSessionFinishedSchema: z.ZodObject<{
    domain: z.ZodLiteral<"FAMILY">;
    type: z.ZodLiteral<"CO_SESSION_FINISHED">;
    data: z.ZodObject<{
        coSessionId: z.ZodString;
        result: z.ZodEnum<{
            COMPLETED: "COMPLETED";
            ABORTED: "ABORTED";
            TIMEOUT: "TIMEOUT";
        }>;
        durationMin: z.ZodNumber;
        summary: z.ZodObject<{
            targetWordsCount: z.ZodNumber;
            checkpointCount: z.ZodNumber;
            checkpointFailCount: z.ZodNumber;
            productionSubmitted: z.ZodBoolean;
        }, z.core.$strip>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const ClassPolicySetSchema: z.ZodObject<{
    domain: z.ZodLiteral<"CLASS">;
    type: z.ZodLiteral<"CLASS_POLICY_SET">;
    data: z.ZodObject<{
        classroomId: z.ZodString;
        policy: z.ZodObject<{
            weeklyUnitsTarget: z.ZodNumber;
            timeboxDefaultMin: z.ZodNumber;
            toolWordsGateEnabled: z.ZodBoolean;
            dailyReviewCap: z.ZodNumber;
            privacyMode: z.ZodEnum<{
                AGGREGATED_ONLY: "AGGREGATED_ONLY";
                AGGREGATED_PLUS_HELP_REQUESTS: "AGGREGATED_PLUS_HELP_REQUESTS";
                AGGREGATED_PLUS_FLAGS: "AGGREGATED_PLUS_FLAGS";
            }>;
            interventionMode: z.ZodEnum<{
                PROMPT_COACH: "PROMPT_COACH";
                PROMPT_COACH_PLUS_1ON1: "PROMPT_COACH_PLUS_1ON1";
            }>;
        }, z.core.$strip>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const ClassWeeklyPlanCreatedSchema: z.ZodObject<{
    domain: z.ZodLiteral<"CLASS">;
    type: z.ZodLiteral<"CLASS_WEEKLY_PLAN_CREATED">;
    data: z.ZodObject<{
        classroomId: z.ZodString;
        weekStart: z.ZodString;
        itemCount: z.ZodNumber;
        toolWordCount: z.ZodNumber;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const ClassAlertRaisedSchema: z.ZodObject<{
    domain: z.ZodLiteral<"CLASS">;
    type: z.ZodLiteral<"CLASS_ALERT_RAISED">;
    data: z.ZodObject<{
        classroomId: z.ZodString;
        learnerUserId: z.ZodString;
        alertType: z.ZodEnum<{
            SLUMP: "SLUMP";
            HELP_REQUEST: "HELP_REQUEST";
            LOW_ENGAGEMENT: "LOW_ENGAGEMENT";
        }>;
        severity: z.ZodEnum<{
            LOW: "LOW";
            MED: "MED";
            HIGH: "HIGH";
        }>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const EventSchemas: {
    FAMILY_POLICY_SET: z.ZodObject<{
        domain: z.ZodLiteral<"FAMILY">;
        type: z.ZodLiteral<"FAMILY_POLICY_SET">;
        data: z.ZodObject<{
            householdId: z.ZodString;
            learnerUserId: z.ZodString;
            policy: z.ZodObject<{
                timeboxDefaultMin: z.ZodNumber;
                coReadingDays: z.ZodArray<z.ZodNumber>;
                coReadingTime: z.ZodOptional<z.ZodString>;
                toolWordsGateEnabled: z.ZodBoolean;
                dailyMinMinutes: z.ZodNumber;
                dailyReviewCap: z.ZodNumber;
                privacyMode: z.ZodEnum<{
                    AGGREGATED_ONLY: "AGGREGATED_ONLY";
                    AGGREGATED_PLUS_TRIGGERS: "AGGREGATED_PLUS_TRIGGERS";
                }>;
            }, z.core.$strip>;
        }, z.core.$strip>;
    }, z.core.$strip>;
    CO_SESSION_STARTED: z.ZodObject<{
        domain: z.ZodLiteral<"FAMILY">;
        type: z.ZodLiteral<"CO_SESSION_STARTED">;
        data: z.ZodObject<{
            householdId: z.ZodString;
            coSessionId: z.ZodString;
            learnerUserId: z.ZodString;
            educatorUserId: z.ZodString;
            readingSessionId: z.ZodString;
            contentId: z.ZodString;
            timeboxMin: z.ZodNumber;
        }, z.core.$strip>;
    }, z.core.$strip>;
    CO_SESSION_PHASE_CHANGED: z.ZodObject<{
        domain: z.ZodLiteral<"FAMILY">;
        type: z.ZodLiteral<"CO_SESSION_PHASE_CHANGED">;
        data: z.ZodObject<{
            coSessionId: z.ZodString;
            phase: z.ZodEnum<{
                POST: "POST";
                PRE: "PRE";
                DURING: "DURING";
                BOOT: "BOOT";
                CLOSE: "CLOSE";
            }>;
        }, z.core.$strip>;
    }, z.core.$strip>;
    EDUCATOR_INTERVENTION_CHOSEN: z.ZodObject<{
        domain: z.ZodLiteral<"FAMILY">;
        type: z.ZodLiteral<"EDUCATOR_INTERVENTION_CHOSEN">;
        data: z.ZodObject<{
            coSessionId: z.ZodString;
            choice: z.ZodEnum<{
                A: "A";
                B: "B";
                C: "C";
            }>;
            reason: z.ZodEnum<{
                CHECKPOINT_FAIL_2X: "CHECKPOINT_FAIL_2X";
                FRUSTRATION_HIGH: "FRUSTRATION_HIGH";
                TIMEBOX_SHORT: "TIMEBOX_SHORT";
            }>;
            note: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>;
    }, z.core.$strip>;
    FAMILY_ALERT_RAISED: z.ZodObject<{
        domain: z.ZodLiteral<"FAMILY">;
        type: z.ZodLiteral<"FAMILY_ALERT_RAISED">;
        data: z.ZodObject<{
            householdId: z.ZodString;
            learnerUserId: z.ZodString;
            alertType: z.ZodEnum<{
                SLUMP: "SLUMP";
                LOW_COMPREHENSION: "LOW_COMPREHENSION";
                HIGH_UNKNOWN_DENSITY: "HIGH_UNKNOWN_DENSITY";
                STREAK_BROKEN: "STREAK_BROKEN";
            }>;
            severity: z.ZodEnum<{
                LOW: "LOW";
                MED: "MED";
                HIGH: "HIGH";
            }>;
            windowDays: z.ZodNumber;
            metrics: z.ZodObject<{
                compAvg: z.ZodNumber;
                unknownDensity: z.ZodNumber;
                streak: z.ZodNumber;
            }, z.core.$strip>;
        }, z.core.$strip>;
    }, z.core.$strip>;
    CO_SESSION_FINISHED: z.ZodObject<{
        domain: z.ZodLiteral<"FAMILY">;
        type: z.ZodLiteral<"CO_SESSION_FINISHED">;
        data: z.ZodObject<{
            coSessionId: z.ZodString;
            result: z.ZodEnum<{
                COMPLETED: "COMPLETED";
                ABORTED: "ABORTED";
                TIMEOUT: "TIMEOUT";
            }>;
            durationMin: z.ZodNumber;
            summary: z.ZodObject<{
                targetWordsCount: z.ZodNumber;
                checkpointCount: z.ZodNumber;
                checkpointFailCount: z.ZodNumber;
                productionSubmitted: z.ZodBoolean;
            }, z.core.$strip>;
        }, z.core.$strip>;
    }, z.core.$strip>;
    CLASS_POLICY_SET: z.ZodObject<{
        domain: z.ZodLiteral<"CLASS">;
        type: z.ZodLiteral<"CLASS_POLICY_SET">;
        data: z.ZodObject<{
            classroomId: z.ZodString;
            policy: z.ZodObject<{
                weeklyUnitsTarget: z.ZodNumber;
                timeboxDefaultMin: z.ZodNumber;
                toolWordsGateEnabled: z.ZodBoolean;
                dailyReviewCap: z.ZodNumber;
                privacyMode: z.ZodEnum<{
                    AGGREGATED_ONLY: "AGGREGATED_ONLY";
                    AGGREGATED_PLUS_HELP_REQUESTS: "AGGREGATED_PLUS_HELP_REQUESTS";
                    AGGREGATED_PLUS_FLAGS: "AGGREGATED_PLUS_FLAGS";
                }>;
                interventionMode: z.ZodEnum<{
                    PROMPT_COACH: "PROMPT_COACH";
                    PROMPT_COACH_PLUS_1ON1: "PROMPT_COACH_PLUS_1ON1";
                }>;
            }, z.core.$strip>;
        }, z.core.$strip>;
    }, z.core.$strip>;
    CLASS_WEEKLY_PLAN_CREATED: z.ZodObject<{
        domain: z.ZodLiteral<"CLASS">;
        type: z.ZodLiteral<"CLASS_WEEKLY_PLAN_CREATED">;
        data: z.ZodObject<{
            classroomId: z.ZodString;
            weekStart: z.ZodString;
            itemCount: z.ZodNumber;
            toolWordCount: z.ZodNumber;
        }, z.core.$strip>;
    }, z.core.$strip>;
    CLASS_ALERT_RAISED: z.ZodObject<{
        domain: z.ZodLiteral<"CLASS">;
        type: z.ZodLiteral<"CLASS_ALERT_RAISED">;
        data: z.ZodObject<{
            classroomId: z.ZodString;
            learnerUserId: z.ZodString;
            alertType: z.ZodEnum<{
                SLUMP: "SLUMP";
                HELP_REQUEST: "HELP_REQUEST";
                LOW_ENGAGEMENT: "LOW_ENGAGEMENT";
            }>;
            severity: z.ZodEnum<{
                LOW: "LOW";
                MED: "MED";
                HIGH: "HIGH";
            }>;
        }, z.core.$strip>;
    }, z.core.$strip>;
};
export type FamilyPolicySetEvent = z.infer<typeof FamilyPolicySetSchema>;
export type CoSessionStartedEvent = z.infer<typeof CoSessionStartedSchema>;
export type CoSessionPhaseChangedEvent = z.infer<typeof CoSessionPhaseChangedSchema>;
export type EducatorInterventionChosenEvent = z.infer<typeof EducatorInterventionChosenSchema>;
export type FamilyAlertRaisedEvent = z.infer<typeof FamilyAlertRaisedSchema>;
export type CoSessionFinishedEvent = z.infer<typeof CoSessionFinishedSchema>;
export type ClassPolicySetEvent = z.infer<typeof ClassPolicySetSchema>;
export type ClassWeeklyPlanCreatedEvent = z.infer<typeof ClassWeeklyPlanCreatedSchema>;
export type ClassAlertRaisedEvent = z.infer<typeof ClassAlertRaisedSchema>;
