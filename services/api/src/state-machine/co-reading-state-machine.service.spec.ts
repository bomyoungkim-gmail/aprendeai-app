import { Test, TestingModule } from '@nestjs/testing';
import { CoReadingStateMachine } from './co-reading-state-machine.service';
import { FamilyEventService } from '../events/family-event.service';
import { CoReadingPhase, CoReadingContext } from './types';

describe('CoReadingStateMachine', () => {
  let service: CoReadingStateMachine;
  let familyEventService: FamilyEventService;

  const mockFamilyEventService = {
    logCoSessionPhaseChanged: jest.fn(),
    logCoSessionFinished: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoReadingStateMachine,
        {
          provide: FamilyEventService,
          useValue: mockFamilyEventService,
        },
      ],
    }).compile();

    service = module.get<CoReadingStateMachine>(CoReadingStateMachine);
    familyEventService = module.get<FamilyEventService>(FamilyEventService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const createMockContext = (
    phase: CoReadingPhase = CoReadingPhase.BOOT,
  ): CoReadingContext => ({
    coSessionId: 'co_123',
    householdId: 'hh_456',
    learnerUserId: 'learner_1',
    educatorUserId: 'educator_1',
    readingSessionId: 'rs_789',
    currentPhase: phase,
    timeboxMin: 20,
    checkpointFailCount: 0,
    startedAt: new Date(),
    phaseStartedAt: new Date(),
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('transition', () => {
    it('should allow valid transition BOOT -> PRE', async () => {
      const context = createMockContext(CoReadingPhase.BOOT);

      const result = await service.transition(context, CoReadingPhase.PRE);

      expect(result.success).toBe(true);
      expect(result.newPhase).toBe(CoReadingPhase.PRE);
      expect(mockFamilyEventService.logCoSessionPhaseChanged).toHaveBeenCalled();
    });

    it('should reject invalid transition BOOT -> DURING', async () => {
      const context = createMockContext(CoReadingPhase.BOOT);

      const result = await service.transition(context, CoReadingPhase.DURING);

      expect(result.success).toBe(false);
      expect(result.newPhase).toBe(CoReadingPhase.BOOT);
      expect(mockFamilyEventService.logCoSessionPhaseChanged).not.toHaveBeenCalled();
    });

    it('should log phase change event on valid transition', async () => {
      const context = createMockContext(CoReadingPhase.PRE);

      await service.transition(context, CoReadingPhase.DURING);

      expect(mockFamilyEventService.logCoSessionPhaseChanged).toHaveBeenCalledWith(
        'rs_789',
        'educator_1',
        {
          domain: 'FAMILY',
          type: 'CO_SESSION_PHASE_CHANGED',
          data: {
            coSessionId: 'co_123',
            phase: CoReadingPhase.DURING,
          },
        },
      );
    });
  });

  describe('timeout handling', () => {
    it('should detect PRE timeout after 2 minutes', () => {
      const context = createMockContext(CoReadingPhase.PRE);
      context.phaseStartedAt = new Date(Date.now() - 3 * 60 * 1000); // 3 min ago

      const hasTimedOut = service.hasPreTimedOut(context);

      expect(hasTimedOut).toBe(true);
    });

    it('should not detect PRE timeout within 2 minutes', () => {
      const context = createMockContext(CoReadingPhase.PRE);
      context.phaseStartedAt = new Date(Date.now() - 1 * 60 * 1000); // 1 min ago

      const hasTimedOut = service.hasPreTimedOut(context);

      expect(hasTimedOut).toBe(false);
    });

    it('should detect DURING timeout when timebox exceeded', () => {
      const context = createMockContext(CoReadingPhase.DURING);
      context.timeboxMin = 20;
      context.startedAt = new Date(Date.now() - 25 * 60 * 1000); // 25 min ago

      const hasTimedOut = service.hasDuringTimedOut(context);

      expect(hasTimedOut).toBe(true);
    });
  });

  describe('checkpoint failure handling', () => {
    it('should not trigger intervention on first failure', async () => {
      const context = createMockContext(CoReadingPhase.DURING);
      context.checkpointFailCount = 0;

      const result = await service.handleCheckpointFail(context);

      expect(result.shouldIntervene).toBe(false);
      expect(result.count).toBe(1);
    });

    it('should trigger intervention on second consecutive failure', async () => {
      const context = createMockContext(CoReadingPhase.DURING);
      context.checkpointFailCount = 1;

      const result = await service.handleCheckpointFail(context);

      expect(result.shouldIntervene).toBe(true);
      expect(result.count).toBe(2);
    });
  });

  describe('close', () => {
    it('should log CO_SESSION_FINISHED event', async () => {
      const context = createMockContext(CoReadingPhase.POST);

      await service.close(context);

      expect(mockFamilyEventService.logCoSessionFinished).toHaveBeenCalledWith(
        'rs_789',
        'educator_1',
        expect.objectContaining({
          domain: 'FAMILY',
          type: 'CO_SESSION_FINISHED',
          data: expect.objectContaining({
            coSessionId: 'co_123',
            result: 'COMPLETED',
          }),
        }),
      );
    });
  });
});
