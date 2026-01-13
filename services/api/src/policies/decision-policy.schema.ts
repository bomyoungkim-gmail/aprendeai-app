import { z } from "zod";

/**
 * DecisionPolicyV1 Schema
 *
 * Canonical schema for decision_policy_json used by institution_policies and family_policies.
 * Defines feature gates, extraction policies, scaffolding thresholds, budgeting, and limits.
 *
 * Hierarchy: GLOBAL (hardcoded defaults) < INSTITUTION < FAMILY
 */

export const DecisionPolicyV1Schema = z.object({
  version: z.literal(1).default(1),

  features: z
    .object({
      transferGraphEnabled: z.boolean().default(true),
      sentenceAnalysisEnabled: z.boolean().default(true),
      pkmEnabled: z.boolean().default(true),
      gamesEnabled: z.boolean().default(true),
      missionFeedbackEnabled: z.boolean().default(true),
      huggingEnabled: z.boolean().default(true),
    })
    .default({
      transferGraphEnabled: true,
      sentenceAnalysisEnabled: true,
      pkmEnabled: true,
      gamesEnabled: true,
      missionFeedbackEnabled: true,
      huggingEnabled: true,
    }),

  extraction: z
    .object({
      allowTextExtraction: z.boolean().default(false),
      allowOcr: z.boolean().default(false),
      selectionRequiredForPdfImage: z.boolean().default(true),
    })
    .default({
      allowTextExtraction: false,
      allowOcr: false,
      selectionRequiredForPdfImage: true,
    }),

  scaffolding: z
    .object({
      fadingEnabled: z.boolean().default(true),
      defaultLevelByMode: z
        .object({
          DIDACTIC: z.number().int().min(0).max(3).default(2),
          TECHNICAL: z.number().int().min(0).max(3).default(1),
          NARRATIVE: z.number().int().min(0).max(3).default(1),
          NEWS: z.number().int().min(0).max(3).default(1),
          SCIENTIFIC: z.number().int().min(0).max(3).default(1),
          LANGUAGE: z.number().int().min(0).max(3).default(2),
        })
        .default({
          DIDACTIC: 2,
          TECHNICAL: 1,
          NARRATIVE: 1,
          NEWS: 1,
          SCIENTIFIC: 1,
          LANGUAGE: 2,
        }),
      thresholds: z
        .object({
          masteryHigh: z.number().min(0).max(1).default(0.8),
          masteryLow: z.number().min(0).max(1).default(0.5),
          consistencyHigh: z.number().int().min(1).max(10).default(3),
          cooldownMinTurns: z.number().int().min(0).max(20).default(2),
        })
        .default({
          masteryHigh: 0.8,
          masteryLow: 0.5,
          consistencyHigh: 3,
          cooldownMinTurns: 2,
        }),
    })
    .default({
      fadingEnabled: true,
      defaultLevelByMode: {
        DIDACTIC: 2,
        TECHNICAL: 1,
        NARRATIVE: 1,
        NEWS: 1,
        SCIENTIFIC: 1,
        LANGUAGE: 2,
      },
      thresholds: {
        masteryHigh: 0.8,
        masteryLow: 0.5,
        consistencyHigh: 3,
        cooldownMinTurns: 2,
      },
    }),

  budgeting: z
    .object({
      strategy: z
        .enum(["DETERMINISTIC_FIRST", "FAST_FIRST"])
        .default("DETERMINISTIC_FIRST"),
      allowSmartTier: z.boolean().default(false),
      monthlyTokenBudgetByScope: z
        .object({
          INSTITUTION: z.number().int().positive().nullable().default(null),
          FAMILY: z.number().int().positive().nullable().default(null),
          USER: z.number().int().positive().nullable().default(null),
        })
        .default({
          INSTITUTION: null,
          FAMILY: null,
          USER: null,
        }),
    })
    .default({
      strategy: "DETERMINISTIC_FIRST",
      allowSmartTier: false,
      monthlyTokenBudgetByScope: {
        INSTITUTION: null,
        FAMILY: null,
        USER: null,
      },
    }),

  limits: z
    .object({
      maxSelectedTextChars: z.number().int().min(200).max(5000).default(900),
      maxChatMessageChars: z.number().int().min(200).max(20000).default(2000),
      maxQuickReplies: z.number().int().min(0).max(10).default(4),
      maxEventsToWritePerTurn: z.number().int().min(5).max(200).default(25),
    })
    .default({
      maxSelectedTextChars: 900,
      maxChatMessageChars: 2000,
      maxQuickReplies: 4,
      maxEventsToWritePerTurn: 25,
    }),
});

export type DecisionPolicyV1 = z.infer<typeof DecisionPolicyV1Schema>;
