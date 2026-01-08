import { Test, TestingModule } from '@nestjs/testing';
import { ContentMode } from '@prisma/client';
import { ScaffoldingInitializerService } from './scaffolding-initializer.service';
import { LearnerProfileForScaffolding } from '../domain/scaffolding.types';

describe('ScaffoldingInitializerService', () => {
  let service: ScaffoldingInitializerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ScaffoldingInitializerService],
    }).compile();

    service = module.get<ScaffoldingInitializerService>(
      ScaffoldingInitializerService
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getInitialLevel', () => {
    describe('DIDACTIC mode', () => {
      it('should return L3 for new users', () => {
        const profile: LearnerProfileForScaffolding = {
          isNewUser: true,
          avgMastery: 0.5,
          recentPerformance: 0.5,
        };

        const level = service.getInitialLevel({
          mode: ContentMode.DIDACTIC,
          learnerProfile: profile,
        });

        expect(level).toBe(3);
      });

      it('should return L3 for low mastery users (avgMastery < 0.4)', () => {
        const profile: LearnerProfileForScaffolding = {
          isNewUser: false,
          avgMastery: 0.3,
          recentPerformance: 0.5,
        };

        const level = service.getInitialLevel({
          mode: ContentMode.DIDACTIC,
          learnerProfile: profile,
        });

        expect(level).toBe(3);
      });

      it('should return L2 for experienced users (avgMastery >= 0.4)', () => {
        const profile: LearnerProfileForScaffolding = {
          isNewUser: false,
          avgMastery: 0.6,
          recentPerformance: 0.7,
        };

        const level = service.getInitialLevel({
          mode: ContentMode.DIDACTIC,
          learnerProfile: profile,
        });

        expect(level).toBe(2);
      });

      it('should return L2 for edge case avgMastery = 0.4', () => {
        const profile: LearnerProfileForScaffolding = {
          isNewUser: false,
          avgMastery: 0.4,
          recentPerformance: 0.5,
        };

        const level = service.getInitialLevel({
          mode: ContentMode.DIDACTIC,
          learnerProfile: profile,
        });

        expect(level).toBe(2);
      });
    });

    describe('NARRATIVE mode', () => {
      it('should return L0 for high mastery users (avgMastery > 0.7)', () => {
        const profile: LearnerProfileForScaffolding = {
          isNewUser: false,
          avgMastery: 0.8,
          recentPerformance: 0.8,
        };

        const level = service.getInitialLevel({
          mode: ContentMode.NARRATIVE,
          learnerProfile: profile,
        });

        expect(level).toBe(0);
      });

      it('should return L1 for average users (avgMastery <= 0.7)', () => {
        const profile: LearnerProfileForScaffolding = {
          isNewUser: false,
          avgMastery: 0.5,
          recentPerformance: 0.5,
        };

        const level = service.getInitialLevel({
          mode: ContentMode.NARRATIVE,
          learnerProfile: profile,
        });

        expect(level).toBe(1);
      });

      it('should return L1 for edge case avgMastery = 0.7', () => {
        const profile: LearnerProfileForScaffolding = {
          isNewUser: false,
          avgMastery: 0.7,
          recentPerformance: 0.7,
        };

        const level = service.getInitialLevel({
          mode: ContentMode.NARRATIVE,
          learnerProfile: profile,
        });

        expect(level).toBe(1);
      });

      it('should return L1 for new users', () => {
        const profile: LearnerProfileForScaffolding = {
          isNewUser: true,
          avgMastery: 0.0,
          recentPerformance: 0.0,
        };

        const level = service.getInitialLevel({
          mode: ContentMode.NARRATIVE,
          learnerProfile: profile,
        });

        expect(level).toBe(1);
      });
    });

    describe('TECHNICAL mode', () => {
      it('should return L1 for high mastery users (avgMastery > 0.6)', () => {
        const profile: LearnerProfileForScaffolding = {
          isNewUser: false,
          avgMastery: 0.7,
          recentPerformance: 0.7,
        };

        const level = service.getInitialLevel({
          mode: ContentMode.TECHNICAL,
          learnerProfile: profile,
        });

        expect(level).toBe(1);
      });

      it('should return L2 for average users (avgMastery <= 0.6)', () => {
        const profile: LearnerProfileForScaffolding = {
          isNewUser: false,
          avgMastery: 0.5,
          recentPerformance: 0.5,
        };

        const level = service.getInitialLevel({
          mode: ContentMode.TECHNICAL,
          learnerProfile: profile,
        });

        expect(level).toBe(2);
      });

      it('should return L2 for edge case avgMastery = 0.6', () => {
        const profile: LearnerProfileForScaffolding = {
          isNewUser: false,
          avgMastery: 0.6,
          recentPerformance: 0.6,
        };

        const level = service.getInitialLevel({
          mode: ContentMode.TECHNICAL,
          learnerProfile: profile,
        });

        expect(level).toBe(2);
      });
    });

    describe('SCIENTIFIC mode', () => {
      it('should return L1 for high mastery users (avgMastery > 0.6)', () => {
        const profile: LearnerProfileForScaffolding = {
          isNewUser: false,
          avgMastery: 0.8,
          recentPerformance: 0.8,
        };

        const level = service.getInitialLevel({
          mode: ContentMode.SCIENTIFIC,
          learnerProfile: profile,
        });

        expect(level).toBe(1);
      });

      it('should return L2 for average users (avgMastery <= 0.6)', () => {
        const profile: LearnerProfileForScaffolding = {
          isNewUser: false,
          avgMastery: 0.4,
          recentPerformance: 0.4,
        };

        const level = service.getInitialLevel({
          mode: ContentMode.SCIENTIFIC,
          learnerProfile: profile,
        });

        expect(level).toBe(2);
      });
    });

    describe('NEWS mode', () => {
      it('should return L1 for good recent performance (recentPerformance > 0.7)', () => {
        const profile: LearnerProfileForScaffolding = {
          isNewUser: false,
          avgMastery: 0.5,
          recentPerformance: 0.8,
        };

        const level = service.getInitialLevel({
          mode: ContentMode.NEWS,
          learnerProfile: profile,
        });

        expect(level).toBe(1);
      });

      it('should return L2 for poor recent performance (recentPerformance <= 0.7)', () => {
        const profile: LearnerProfileForScaffolding = {
          isNewUser: false,
          avgMastery: 0.5,
          recentPerformance: 0.5,
        };

        const level = service.getInitialLevel({
          mode: ContentMode.NEWS,
          learnerProfile: profile,
        });

        expect(level).toBe(2);
      });

      it('should return L2 for edge case recentPerformance = 0.7', () => {
        const profile: LearnerProfileForScaffolding = {
          isNewUser: false,
          avgMastery: 0.5,
          recentPerformance: 0.7,
        };

        const level = service.getInitialLevel({
          mode: ContentMode.NEWS,
          learnerProfile: profile,
        });

        expect(level).toBe(2);
      });
    });

    describe('GAP 6: Policy Override', () => {
      it('should respect valid policy override (L0)', () => {
        const profile: LearnerProfileForScaffolding = {
          isNewUser: true,
          avgMastery: 0.2,
          recentPerformance: 0.3,
        };

        const level = service.getInitialLevel({
          mode: ContentMode.DIDACTIC,
          learnerProfile: profile,
          policyOverride: 0,
        });

        expect(level).toBe(0);
      });

      it('should respect valid policy override (L1)', () => {
        const profile: LearnerProfileForScaffolding = {
          isNewUser: true,
          avgMastery: 0.2,
          recentPerformance: 0.3,
        };

        const level = service.getInitialLevel({
          mode: ContentMode.DIDACTIC,
          learnerProfile: profile,
          policyOverride: 1,
        });

        expect(level).toBe(1);
      });

      it('should respect valid policy override (L2)', () => {
        const profile: LearnerProfileForScaffolding = {
          isNewUser: true,
          avgMastery: 0.2,
          recentPerformance: 0.3,
        };

        const level = service.getInitialLevel({
          mode: ContentMode.DIDACTIC,
          learnerProfile: profile,
          policyOverride: 2,
        });

        expect(level).toBe(2);
      });

      it('should respect valid policy override (L3)', () => {
        const profile: LearnerProfileForScaffolding = {
          isNewUser: false,
          avgMastery: 0.9,
          recentPerformance: 0.9,
        };

        const level = service.getInitialLevel({
          mode: ContentMode.NARRATIVE,
          learnerProfile: profile,
          policyOverride: 3,
        });

        expect(level).toBe(3);
      });

      it('should ignore invalid policy override (negative)', () => {
        const profile: LearnerProfileForScaffolding = {
          isNewUser: true,
          avgMastery: 0.2,
          recentPerformance: 0.3,
        };

        const level = service.getInitialLevel({
          mode: ContentMode.DIDACTIC,
          learnerProfile: profile,
          policyOverride: -1,
        });

        expect(level).toBe(3); // Should use normal logic (new user → L3)
      });

      it('should ignore invalid policy override (> 3)', () => {
        const profile: LearnerProfileForScaffolding = {
          isNewUser: true,
          avgMastery: 0.2,
          recentPerformance: 0.3,
        };

        const level = service.getInitialLevel({
          mode: ContentMode.DIDACTIC,
          learnerProfile: profile,
          policyOverride: 5,
        });

        expect(level).toBe(3); // Should use normal logic
      });

      it('should ignore invalid policy override (float)', () => {
        const profile: LearnerProfileForScaffolding = {
          isNewUser: true,
          avgMastery: 0.2,
          recentPerformance: 0.3,
        };

        const level = service.getInitialLevel({
          mode: ContentMode.DIDACTIC,
          learnerProfile: profile,
          policyOverride: 1.5,
        });

        expect(level).toBe(3); // Should use normal logic
      });

      it('should work when policyOverride is undefined', () => {
        const profile: LearnerProfileForScaffolding = {
          isNewUser: false,
          avgMastery: 0.6,
          recentPerformance: 0.7,
        };

        const level = service.getInitialLevel({
          mode: ContentMode.DIDACTIC,
          learnerProfile: profile,
          policyOverride: undefined,
        });

        expect(level).toBe(2); // Should use normal logic
      });
    });

    describe('Edge Cases', () => {
      it('should handle avgMastery = 0', () => {
        const profile: LearnerProfileForScaffolding = {
          isNewUser: false,
          avgMastery: 0,
          recentPerformance: 0,
        };

        const level = service.getInitialLevel({
          mode: ContentMode.DIDACTIC,
          learnerProfile: profile,
        });

        expect(level).toBe(3); // Low mastery → L3
      });

      it('should handle avgMastery = 1', () => {
        const profile: LearnerProfileForScaffolding = {
          isNewUser: false,
          avgMastery: 1,
          recentPerformance: 1,
        };

        const level = service.getInitialLevel({
          mode: ContentMode.NARRATIVE,
          learnerProfile: profile,
        });

        expect(level).toBe(0); // Perfect mastery → L0
      });

      it('should return L2 for unknown ContentMode', () => {
        const profile: LearnerProfileForScaffolding = {
          isNewUser: false,
          avgMastery: 0.5,
          recentPerformance: 0.5,
        };

        const level = service.getInitialLevel({
          mode: 'UNKNOWN_MODE' as ContentMode,
          learnerProfile: profile,
        });

        expect(level).toBe(2); // Fallback to L2
      });
    });
  });
});
