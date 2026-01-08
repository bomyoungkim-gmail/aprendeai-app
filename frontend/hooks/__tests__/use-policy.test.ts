/**
 * Tests for usePolicy hook
 */

import { renderHook } from '@testing-library/react';
import { usePolicy } from '../use-policy';
import type { DecisionPolicyV1 } from '@/types/session';

describe('usePolicy', () => {
  describe('Safe Defaults', () => {
    it('should return safe defaults when policy is undefined', () => {
      const { result } = renderHook(() => usePolicy({}));
      
      // Features: enabled by default (optimistic)
      expect(result.current.isTransferGraphEnabled).toBe(true);
      expect(result.current.isSentenceAnalysisEnabled).toBe(true);
      expect(result.current.isPkmEnabled).toBe(true);
      expect(result.current.isGamesEnabled).toBe(true);
      expect(result.current.isMissionFeedbackEnabled).toBe(true);
      expect(result.current.isHuggingEnabled).toBe(true);
      
      // Extraction: disabled by default (conservative)
      expect(result.current.allowTextExtraction).toBe(false);
      expect(result.current.allowOcr).toBe(false);
      
      // Other defaults
      expect(result.current.masteryThresholds.high).toBe(0.8);
      expect(result.current.masteryThresholds.low).toBe(0.4);
      expect(result.current.budgetStrategy).toBe('DETERMINISTIC_FIRST');
      expect(result.current.maxLlmCalls).toBe(10);
      expect(result.current.maxSelectedTextChars).toBe(900);
    });
  });

  describe('Feature Gates', () => {
    it('should respect transferGraphEnabled gate', () => {
      const policy: DecisionPolicyV1 = {
        version: 1,
        features: {
          transferGraphEnabled: false,
          sentenceAnalysisEnabled: true,
          pkmEnabled: true,
          gamesEnabled: true,
          missionFeedbackEnabled: true,
          huggingEnabled: true,
        },
        extraction: {
          allowTextExtraction: false,
          allowOcr: false,
        },
        scaffolding: {
          thresholds: { masteryHigh: 0.8, masteryLow: 0.4, frustrationHigh: 0.7 },
          adaptiveScaffolding: true,
        },
        budgeting: {
          strategy: 'DETERMINISTIC_FIRST',
          maxLlmCallsPerSession: 10,
        },
        limits: {
          maxSelectedTextChars: 900,
        },
      };

      const { result } = renderHook(() => usePolicy({ policy }));
      
      expect(result.current.isTransferGraphEnabled).toBe(false);
      expect(result.current.isSentenceAnalysisEnabled).toBe(true);
    });

    it('should respect all feature gates', () => {
      const policy: DecisionPolicyV1 = {
        version: 1,
        features: {
          transferGraphEnabled: false,
          sentenceAnalysisEnabled: false,
          pkmEnabled: false,
          gamesEnabled: false,
          missionFeedbackEnabled: false,
          huggingEnabled: false,
        },
        extraction: {
          allowTextExtraction: false,
          allowOcr: false,
        },
        scaffolding: {
          thresholds: { masteryHigh: 0.8, masteryLow: 0.4, frustrationHigh: 0.7 },
          adaptiveScaffolding: true,
        },
        budgeting: {
          strategy: 'DETERMINISTIC_FIRST',
          maxLlmCallsPerSession: 10,
        },
        limits: {
          maxSelectedTextChars: 900,
        },
      };

      const { result } = renderHook(() => usePolicy({ policy }));
      
      expect(result.current.isTransferGraphEnabled).toBe(false);
      expect(result.current.isSentenceAnalysisEnabled).toBe(false);
      expect(result.current.isPkmEnabled).toBe(false);
      expect(result.current.isGamesEnabled).toBe(false);
      expect(result.current.isMissionFeedbackEnabled).toBe(false);
      expect(result.current.isHuggingEnabled).toBe(false);
    });
  });

  describe('Extraction Gates', () => {
    it('should respect allowTextExtraction gate', () => {
      const policy: DecisionPolicyV1 = {
        version: 1,
        features: {
          transferGraphEnabled: true,
          sentenceAnalysisEnabled: true,
          pkmEnabled: true,
          gamesEnabled: true,
          missionFeedbackEnabled: true,
          huggingEnabled: true,
        },
        extraction: {
          allowTextExtraction: true,
          allowOcr: false,
        },
        scaffolding: {
          thresholds: { masteryHigh: 0.8, masteryLow: 0.4, frustrationHigh: 0.7 },
          adaptiveScaffolding: true,
        },
        budgeting: {
          strategy: 'DETERMINISTIC_FIRST',
          maxLlmCallsPerSession: 10,
        },
        limits: {
          maxSelectedTextChars: 900,
        },
      };

      const { result } = renderHook(() => usePolicy({ policy }));
      
      expect(result.current.allowTextExtraction).toBe(true);
      expect(result.current.allowOcr).toBe(false);
    });

    it('should respect allowOcr gate', () => {
      const policy: DecisionPolicyV1 = {
        version: 1,
        features: {
          transferGraphEnabled: true,
          sentenceAnalysisEnabled: true,
          pkmEnabled: true,
          gamesEnabled: true,
          missionFeedbackEnabled: true,
          huggingEnabled: true,
        },
        extraction: {
          allowTextExtraction: false,
          allowOcr: true,
        },
        scaffolding: {
          thresholds: { masteryHigh: 0.8, masteryLow: 0.4, frustrationHigh: 0.7 },
          adaptiveScaffolding: true,
        },
        budgeting: {
          strategy: 'DETERMINISTIC_FIRST',
          maxLlmCallsPerSession: 10,
        },
        limits: {
          maxSelectedTextChars: 900,
        },
      };

      const { result } = renderHook(() => usePolicy({ policy }));
      
      expect(result.current.allowOcr).toBe(true);
      expect(result.current.allowTextExtraction).toBe(false);
    });
  });

  describe('Scaffolding Config', () => {
    it('should return custom thresholds', () => {
      const policy: DecisionPolicyV1 = {
        version: 1,
        features: {
          transferGraphEnabled: true,
          sentenceAnalysisEnabled: true,
          pkmEnabled: true,
          gamesEnabled: true,
          missionFeedbackEnabled: true,
          huggingEnabled: true,
        },
        extraction: {
          allowTextExtraction: false,
          allowOcr: false,
        },
        scaffolding: {
          thresholds: { masteryHigh: 0.9, masteryLow: 0.3, frustrationHigh: 0.8 },
          adaptiveScaffolding: false,
        },
        budgeting: {
          strategy: 'DETERMINISTIC_FIRST',
          maxLlmCallsPerSession: 10,
        },
        limits: {
          maxSelectedTextChars: 900,
        },
      };

      const { result } = renderHook(() => usePolicy({ policy }));
      
      expect(result.current.masteryThresholds.high).toBe(0.9);
      expect(result.current.masteryThresholds.low).toBe(0.3);
      expect(result.current.masteryThresholds.frustrationHigh).toBe(0.8);
      expect(result.current.adaptiveScaffolding).toBe(false);
    });
  });

  describe('Budgeting Config', () => {
    it('should return custom budget strategy', () => {
      const policy: DecisionPolicyV1 = {
        version: 1,
        features: {
          transferGraphEnabled: true,
          sentenceAnalysisEnabled: true,
          pkmEnabled: true,
          gamesEnabled: true,
          missionFeedbackEnabled: true,
          huggingEnabled: true,
        },
        extraction: {
          allowTextExtraction: false,
          allowOcr: false,
        },
        scaffolding: {
          thresholds: { masteryHigh: 0.8, masteryLow: 0.4, frustrationHigh: 0.7 },
          adaptiveScaffolding: true,
        },
        budgeting: {
          strategy: 'LLM_FIRST',
          maxLlmCallsPerSession: 20,
        },
        limits: {
          maxSelectedTextChars: 900,
        },
      };

      const { result } = renderHook(() => usePolicy({ policy }));
      
      expect(result.current.budgetStrategy).toBe('LLM_FIRST');
      expect(result.current.maxLlmCalls).toBe(20);
    });
  });

  describe('Limits', () => {
    it('should return custom limits', () => {
      const policy: DecisionPolicyV1 = {
        version: 1,
        features: {
          transferGraphEnabled: true,
          sentenceAnalysisEnabled: true,
          pkmEnabled: true,
          gamesEnabled: true,
          missionFeedbackEnabled: true,
          huggingEnabled: true,
        },
        extraction: {
          allowTextExtraction: false,
          allowOcr: false,
        },
        scaffolding: {
          thresholds: { masteryHigh: 0.8, masteryLow: 0.4, frustrationHigh: 0.7 },
          adaptiveScaffolding: true,
        },
        budgeting: {
          strategy: 'DETERMINISTIC_FIRST',
          maxLlmCallsPerSession: 10,
        },
        limits: {
          maxSelectedTextChars: 1500,
        },
      };

      const { result } = renderHook(() => usePolicy({ policy }));
      
      expect(result.current.maxSelectedTextChars).toBe(1500);
    });
  });

  describe('Raw Policy Access', () => {
    it('should provide access to raw policy', () => {
      const policy: DecisionPolicyV1 = {
        version: 1,
        features: {
          transferGraphEnabled: true,
          sentenceAnalysisEnabled: true,
          pkmEnabled: true,
          gamesEnabled: true,
          missionFeedbackEnabled: true,
          huggingEnabled: true,
        },
        extraction: {
          allowTextExtraction: false,
          allowOcr: false,
        },
        scaffolding: {
          thresholds: { masteryHigh: 0.8, masteryLow: 0.4, frustrationHigh: 0.7 },
          adaptiveScaffolding: true,
        },
        budgeting: {
          strategy: 'DETERMINISTIC_FIRST',
          maxLlmCallsPerSession: 10,
        },
        limits: {
          maxSelectedTextChars: 900,
        },
      };

      const { result } = renderHook(() => usePolicy({ policy }));
      
      expect(result.current.policy).toEqual(policy);
    });

    it('should return undefined policy when not provided', () => {
      const { result } = renderHook(() => usePolicy({}));
      
      expect(result.current.policy).toBeUndefined();
    });
  });
});
