import { parseDecisionPolicy } from './decision-policy.parse';
import { mergeDecisionPolicies } from './decision-policy.merge';
import { DecisionPolicyV1 } from './decision-policy.schema';

describe('DecisionPolicy - Parse and Merge', () => {
  describe('parseDecisionPolicy', () => {
    it('should return full defaults for empty object', () => {
      const policy = parseDecisionPolicy({}, 'TEST');

      expect(policy.version).toBe(1);
      expect(policy.features.transferGraphEnabled).toBe(true);
      expect(policy.extraction.allowTextExtraction).toBe(false);
      expect(policy.scaffolding.thresholds.masteryHigh).toBe(0.8);
      expect(policy.budgeting.strategy).toBe('DETERMINISTIC_FIRST');
      expect(policy.limits.maxSelectedTextChars).toBe(900);
    });

    it('should parse partial override and fill missing fields with defaults', () => {
      const raw = {
        features: {
          transferGraphEnabled: false,
        },
      };

      const policy = parseDecisionPolicy(raw, 'TEST');

      expect(policy.features.transferGraphEnabled).toBe(false);
      expect(policy.features.sentenceAnalysisEnabled).toBe(true); // default
      expect(policy.extraction.allowTextExtraction).toBe(false); // default
    });

    it('should fallback to defaults on invalid schema', () => {
      const raw = {
        features: {
          transferGraphEnabled: 'invalid', // should be boolean
        },
      };

      const policy = parseDecisionPolicy(raw, 'TEST');

      // Should use defaults
      expect(policy.features.transferGraphEnabled).toBe(true);
    });

    it('should ignore unknown keys', () => {
      const raw = {
        unknownKey: 'value',
        features: {
          transferGraphEnabled: false,
        },
      };

      const policy = parseDecisionPolicy(raw, 'TEST');

      expect(policy.features.transferGraphEnabled).toBe(false);
      expect((policy as any).unknownKey).toBeUndefined();
    });
  });

  describe('mergeDecisionPolicies', () => {
    it('should merge GLOBAL < INSTITUTION < FAMILY hierarchy', () => {
      const global: DecisionPolicyV1 = parseDecisionPolicy({}, 'GLOBAL');
      
      const institution: DecisionPolicyV1 = parseDecisionPolicy(
        {
          features: {
            transferGraphEnabled: false,
          },
          limits: {
            maxSelectedTextChars: 1200,
          },
        },
        'INSTITUTION',
      );

      const family: DecisionPolicyV1 = parseDecisionPolicy(
        {
          limits: {
            maxSelectedTextChars: 500,
          },
        },
        'FAMILY',
      );

      const merged = mergeDecisionPolicies(global, institution, family);

      // FAMILY overrides INSTITUTION
      expect(merged.limits.maxSelectedTextChars).toBe(500);
      // INSTITUTION overrides GLOBAL
      expect(merged.features.transferGraphEnabled).toBe(false);
      // GLOBAL defaults preserved
      expect(merged.features.sentenceAnalysisEnabled).toBe(true);
      expect(merged.scaffolding.thresholds.masteryHigh).toBe(0.8);
    });

    it('should deep merge nested objects', () => {
      const global: DecisionPolicyV1 = parseDecisionPolicy({}, 'GLOBAL');

      const family: DecisionPolicyV1 = parseDecisionPolicy(
        {
          scaffolding: {
            thresholds: {
              masteryHigh: 0.9,
            },
          },
        },
        'FAMILY',
      );

      const merged = mergeDecisionPolicies(global, family);

      // FAMILY overrides masteryHigh
      expect(merged.scaffolding.thresholds.masteryHigh).toBe(0.9);
      // Other thresholds from GLOBAL
      expect(merged.scaffolding.thresholds.masteryLow).toBe(0.5);
      expect(merged.scaffolding.thresholds.consistencyHigh).toBe(3);
    });

    it('should handle single policy (no merge needed)', () => {
      const global: DecisionPolicyV1 = parseDecisionPolicy({}, 'GLOBAL');

      const merged = mergeDecisionPolicies(global);

      expect(merged).toEqual(global);
    });

    it('should re-validate after merge', () => {
      const global: DecisionPolicyV1 = parseDecisionPolicy({}, 'GLOBAL');

      const institution: DecisionPolicyV1 = parseDecisionPolicy(
        {
          limits: {
            maxSelectedTextChars: 1200,
            maxChatMessageChars: 3000,
          },
        },
        'INSTITUTION',
      );

      const merged = mergeDecisionPolicies(global, institution);

      // Ensure all fields are present and valid
      expect(merged.version).toBe(1);
      expect(merged.limits.maxSelectedTextChars).toBe(1200);
      expect(merged.limits.maxChatMessageChars).toBe(3000);
      expect(merged.limits.maxQuickReplies).toBe(4); // from global
    });
  });
});
