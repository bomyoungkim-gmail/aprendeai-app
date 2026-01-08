import { Test, TestingModule } from '@nestjs/testing';
import { OpsCoachService } from './ops-coach.service';
import { PromptLibraryService } from '../../prompts/prompt-library.service';
import { GamificationService } from '../../gamification/gamification.service';
import { SrsService } from '../../srs/srs.service';

describe('OpsCoachService - Phase-Based Prompts', () => {
  let service: OpsCoachService;
  let promptLibrary: PromptLibraryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OpsCoachService,
        PromptLibraryService,
        {
          provide: GamificationService,
          useValue: {
            getDashboard: jest.fn().mockResolvedValue({
              dailyActivity: { minutes_spent: 25 },
            }),
          },
        },
        {
          provide: SrsService,
          useValue: {
            getStageInterval: jest.fn().mockReturnValue(3),
          },
        },
      ],
    }).compile();

    service = module.get<OpsCoachService>(OpsCoachService);
    promptLibrary = module.get<PromptLibraryService>(PromptLibraryService);
  });

  describe('getDailyBootLearner', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
      expect(service.getDailyBootLearner).toBeDefined();
    });

    describe('Phase: BOOT', () => {
      it('should return OPS_DAILY_BOOT_LEARNER prompt when phase is BOOT', () => {
        const result = service.getDailyBootLearner('BOOT');
        
        expect(result).toBeDefined();
        expect(result.key).toBe('OPS_DAILY_BOOT_LEARNER');
        expect(result.audience).toBe('LEARNER');
        expect(result.phase).toBe('BOOT');
        expect(result.nextPrompt).toContain('Meta de hoje');
      });

      it('should return OPS_DAILY_BOOT_LEARNER prompt when no phase is provided (default)', () => {
        const result = service.getDailyBootLearner();
        
        expect(result).toBeDefined();
        expect(result.key).toBe('OPS_DAILY_BOOT_LEARNER');
        expect(result.audience).toBe('LEARNER');
        expect(result.phase).toBe('BOOT');
      });

      it('should return OPS_DAILY_BOOT_LEARNER prompt when phase is undefined', () => {
        const result = service.getDailyBootLearner(undefined);
        
        expect(result).toBeDefined();
        expect(result.key).toBe('OPS_DAILY_BOOT_LEARNER');
      });
    });

    describe('Phase: PRE', () => {
      it('should return READ_PRE_CHOICE_SKIM prompt when phase is PRE', () => {
        const result = service.getDailyBootLearner('PRE');
        
        expect(result).toBeDefined();
        expect(result.key).toBe('READ_PRE_CHOICE_SKIM');
        expect(result.audience).toBe('LEARNER');
        expect(result.phase).toBe('PRE');
        expect(result.nextPrompt).toContain('olhada rápida');
      });

      it('should have appropriate quick replies for PRE phase', () => {
        const result = service.getDailyBootLearner('PRE');
        
        expect(result.quickReplies).toBeDefined();
        expect(result.quickReplies.length).toBeGreaterThan(0);
        expect(result.quickReplies).toContain('Sim, dar uma olhada');
      });
    });

    describe('Phase: DURING', () => {
      it('should return READ_DURING_MARK_RULE prompt when phase is DURING', () => {
        const result = service.getDailyBootLearner('DURING');
        
        expect(result).toBeDefined();
        expect(result.key).toBe('READ_DURING_MARK_RULE');
        expect(result.audience).toBe('LEARNER');
        expect(result.phase).toBe('DURING');
        expect(result.nextPrompt).toContain('marque');
      });

      it('should include marking commands in quick replies', () => {
        const result = service.getDailyBootLearner('DURING');
        
        expect(result.quickReplies).toBeDefined();
        expect(result.quickReplies.some(reply => reply.includes('/mark'))).toBe(true);
      });
    });

    describe('Phase: POST', () => {
      it('should return READ_POST_FREE_RECALL prompt when phase is POST', () => {
        const result = service.getDailyBootLearner('POST');
        
        expect(result).toBeDefined();
        expect(result.key).toBe('READ_POST_FREE_RECALL');
        expect(result.audience).toBe('LEARNER');
        expect(result.phase).toBe('POST');
        expect(result.nextPrompt).toContain('resuma');
      });

      it('should encourage free recall without looking at text', () => {
        const result = service.getDailyBootLearner('POST');
        
        expect(result.nextPrompt).toContain('Sem olhar o texto');
      });
    });

    describe('Phase: FINISHED', () => {
      it('should return READ_FINISHED_SUMMARY prompt when phase is FINISHED', () => {
        const result = service.getDailyBootLearner('FINISHED');
        
        expect(result).toBeDefined();
        expect(result.key).toBe('READ_FINISHED_SUMMARY');
        expect(result.audience).toBe('LEARNER');
        expect(result.phase).toBe('FINISHED');
      });

      it('should include gamification elements in FINISHED prompt', () => {
        const result = service.getDailyBootLearner('FINISHED');
        expect(result.nextPrompt).toContain('XP');
      });

      it('should have appropriate quick replies for FINISHED phase', () => {
        const result = service.getDailyBootLearner('FINISHED');
        
        expect(result.quickReplies).toBeDefined();
        expect(result.quickReplies.length).toBeGreaterThan(0);
      });
    });

    describe('Error Handling', () => {
      it('should throw error for invalid phase', () => {
        // @ts-ignore - Testing runtime behavior with invalid input
        expect(() => service.getDailyBootLearner('INVALID_PHASE')).toThrow();
      });

      it('should throw error with descriptive message for invalid phase', () => {
        // @ts-ignore - Testing runtime behavior
        expect(() => service.getDailyBootLearner('INVALID_PHASE')).toThrow(
          /No prompt defined for phase/
        );
      });
    });

    describe('Backward Compatibility', () => {
      it('should maintain backward compatibility with existing code calling without parameters', () => {
        const resultWithoutParam = service.getDailyBootLearner();
        const resultWithBoot = service.getDailyBootLearner('BOOT');
        
        expect(resultWithoutParam.key).toBe(resultWithBoot.key);
        expect(resultWithoutParam.nextPrompt).toBe(resultWithBoot.nextPrompt);
      });
    });

    describe('Prompt Structure Validation', () => {
    const phases: Array<'BOOT' | 'PRE' | 'DURING' | 'POST' | 'FINISHED'> = ['BOOT', 'PRE', 'DURING', 'POST', 'FINISHED'];

      phases.forEach(phase => {
        it(`should return valid prompt structure for ${phase} phase`, () => {
          const result = service.getDailyBootLearner(phase);
          
          expect(result).toHaveProperty('key');
          expect(result).toHaveProperty('audience');
          expect(result).toHaveProperty('phase');
          expect(result).toHaveProperty('nextPrompt');
          expect(result).toHaveProperty('quickReplies');
          expect(result).toHaveProperty('notes');
          
          expect(typeof result.key).toBe('string');
          expect(typeof result.nextPrompt).toBe('string');
          expect(Array.isArray(result.quickReplies)).toBe(true);
        });

        it(`should return LEARNER audience for ${phase} phase`, () => {
          const result = service.getDailyBootLearner(phase);
          expect(result.audience).toBe('LEARNER');
        });
      });
    });
  });

  describe('Integration with PromptLibraryService', () => {
    it('should successfully retrieve prompts from PromptLibraryService', () => {
      const spy = jest.spyOn(promptLibrary, 'getPrompt');
      
      service.getDailyBootLearner('PRE');
      
      expect(spy).toHaveBeenCalledWith('READ_PRE_CHOICE_SKIM');
    });

    it('should handle prompt library errors gracefully', () => {
      jest.spyOn(promptLibrary, 'getPrompt').mockImplementation(() => {
        throw new Error('Prompt not found');
      });
      
      expect(() => service.getDailyBootLearner('PRE')).toThrow('Prompt not found');
    });
  });
});
