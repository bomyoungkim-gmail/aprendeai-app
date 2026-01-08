import { Test, TestingModule } from '@nestjs/testing';
import { AnswerCheckpointUseCase } from '../application/use-cases/answer-checkpoint.use-case';
import { IAssessmentRepository } from '../domain/interfaces/assessment.repository.interface';
import { TelemetryService } from '../../telemetry/telemetry.service';
import { ScaffoldingService } from '../../decision/application/scaffolding.service';
import { FeedbackGenerationService } from '../application/feedback-generation.service';
import { NotFoundException } from '@nestjs/common';
import { TelemetryEventType } from '../../telemetry/domain/telemetry.constants';

// Mock all dependencies to avoid loading their imports (Prisma, LLM, etc.)
jest.mock('../../telemetry/telemetry.service');
jest.mock('../../decision/application/scaffolding.service');
jest.mock('../application/feedback-generation.service');
jest.mock('../../llm/llm.service');

describe('AnswerCheckpointUseCase', () => {
  let useCase: AnswerCheckpointUseCase;
  let repository: any;
  let telemetryService: any;
  let scaffoldingService: any;
  let feedbackService: any;

  const mockQuestion = {
    id: 'q1',
    assessmentId: 'ass1',
    correctAnswer: { option: 'A' },
    skills: ['algebra'],
    questionText: 'What is 2+2?',
  };

  const mockAttempt = {
    id: 'att1',
    assessmentId: 'ass1',
    userId: 'user1',
    finishedAt: new Date(),
  };

  beforeEach(async () => {
    repository = {
      findQuestionById: jest.fn(),
      createAttempt: jest.fn(),
    };

    telemetryService = {
      track: jest.fn(),
    };

    scaffoldingService = {
      updateMasteryFromCheckpoint: jest.fn(),
    };

    feedbackService = {
      generateFeedback: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnswerCheckpointUseCase,
        {
          provide: IAssessmentRepository,
          useValue: repository,
        },
        {
          provide: TelemetryService,
          useValue: telemetryService,
        },
        {
          provide: ScaffoldingService,
          useValue: scaffoldingService,
        },
        {
          provide: FeedbackGenerationService,
          useValue: feedbackService,
        },
      ],
    }).compile();

    useCase = module.get<AnswerCheckpointUseCase>(AnswerCheckpointUseCase);
  });

  it('should evaluate correct answer successfully', async () => {
    // Arrange
    const dto = {
      checkpointId: 'q1',
      sessionId: 'sess1',
      answer: { option: 'A' },
    };
    repository.findQuestionById.mockResolvedValue(mockQuestion);
    repository.createAttempt.mockResolvedValue(mockAttempt);

    // Act
    const result = await useCase.execute('user1', dto);

    // Assert
    expect(result.correct).toBe(true);
    expect(result.feedback).toBe('Correct! Well done.');
    expect(telemetryService.track).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: TelemetryEventType.MICRO_CHECK_ANSWERED,
        data: expect.objectContaining({ correct: true }),
      }),
      'user1',
    );
    expect(scaffoldingService.updateMasteryFromCheckpoint).toHaveBeenCalledWith(
      'user1',
      'algebra',
      true,
    );
    expect(repository.createAttempt).toHaveBeenCalled();
  });

  it('should evaluate incorrect answer and generate feedback', async () => {
    // Arrange
    const dto = {
      checkpointId: 'q1',
      sessionId: 'sess1',
      answer: { option: 'B' },
    };
    repository.findQuestionById.mockResolvedValue(mockQuestion);
    repository.createAttempt.mockResolvedValue(mockAttempt);
    feedbackService.generateFeedback.mockResolvedValue('Try again, hint hint.');

    // Act
    const result = await useCase.execute('user1', dto);

    // Assert
    expect(result.correct).toBe(false);
    expect(result.feedback).toBe('Try again, hint hint.');
    expect(telemetryService.track).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: TelemetryEventType.MICRO_CHECK_ANSWERED,
        data: expect.objectContaining({ correct: false }),
      }),
      'user1',
    );
    expect(feedbackService.generateFeedback).toHaveBeenCalledWith(
      mockQuestion,
      dto.answer,
      mockQuestion.correctAnswer,
    );
    expect(scaffoldingService.updateMasteryFromCheckpoint).toHaveBeenCalledWith(
      'user1',
      'algebra',
      false,
    );
  });

  it('should throw NotFoundException if question does not exist', async () => {
    // Arrange
    repository.findQuestionById.mockResolvedValue(null);

    // Act & Assert
    await expect(
      useCase.execute('user1', {
        checkpointId: 'invalid',
        sessionId: 'sess1',
        answer: {},
      }),
    ).rejects.toThrow(NotFoundException);
  });
});
