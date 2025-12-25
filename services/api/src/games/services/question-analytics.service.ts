import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
import { TopicMasteryService } from '../../analytics/topic-mastery.service';
import { SubmitQuestionResultDto, QuestionResultWithAnalyticsDto } from '../dto/question-result.dto';

@Injectable()
export class QuestionAnalyticsService {
  private readonly logger = new Logger(QuestionAnalyticsService.name);
  private activeGameSessions = new Map<string, { sessionId: string; startTime: Date; questionsCount: number }>();

  constructor(
    private prisma: PrismaService,
    private topicMastery: TopicMasteryService,
    private eventEmitter: EventEmitter2,
  ) {}

  async recordResult(userId: string, dto: SubmitQuestionResultDto): Promise<QuestionResultWithAnalyticsDto> {
    const { questionId, score, timeTaken, isCorrect, selfRating, userAnswer, mistakes, gameSessionId } = dto;

    // Track game session for analytics
    await this.trackGameSession(userId, gameSessionId, questionId, isCorrect, timeTaken);

    // 1. Save the individual result
    const result = await this.prisma.questionResult.create({
      data: {
        userId,
        questionId,
        score,
        timeTaken,
        isCorrect,
        selfRating,
        userAnswer: userAnswer || {},
        mistakes: mistakes || {},
        gameSessionId,
      },
    });

    const question = await this.prisma.questionBank.findUnique({
        where: { id: questionId },
        select: { topic: true, subject: true },
    });

    // 2. Update Question Analytics (Async aggregation)
    const promises: Promise<any>[] = [
      this.updateQuestionStats(questionId, score, timeTaken, isCorrect, selfRating),
    ];

    if (question) {
        promises.push(
            this.topicMastery.updateMastery(userId, question.topic, question.subject, isCorrect, timeTaken)
        );
    }
    
    await Promise.all(promises);

    // 3. Return result with updated context
    const analytics = await this.prisma.questionAnalytics.findUnique({
      where: { questionId },
    });

    return {
      id: result.id,
      userId: result.userId,
      questionId: result.questionId,
      score: result.score,
      timeTaken: result.timeTaken,
      isCorrect: result.isCorrect,
      selfRating: result.selfRating,
      createdAt: result.createdAt,
      questionAnalytics: {
        totalAttempts: analytics?.totalAttempts || 1,
        successRate: analytics?.successRate || (isCorrect ? 100 : 0),
        avgScore: analytics?.avgScore || score,
        isDifficult: analytics?.isDifficult || false,
      },
      // Calculate next review date if it's SRS (simplified algorithm)
      nextReviewDate: selfRating ? this.calculateNextReview(selfRating) : undefined,
    };
  }

  /**
   * Track game session for Study Session analytics
   */
  private async trackGameSession(
    userId: string,
    gameSessionId: string | undefined,
    questionId: string,
    isCorrect: boolean,
    timeTaken: number,
  ) {
    if (!gameSessionId) return;

    const sessionKey = `${userId}-${gameSessionId}`;
    let sessionData = this.activeGameSessions.get(sessionKey);

    if (!sessionData) {
      // Start new study session
      this.eventEmitter.emit('session.started', {
        userId,
        activityType: 'game',
        sourceId: gameSessionId,
      });

      sessionData = {
        sessionId: '', // Will be set by listener
        startTime: new Date(),
        questionsCount: 0,
      };
      this.activeGameSessions.set(sessionKey, sessionData);
    }

    sessionData.questionsCount++;

    // Auto-finish session after 10 questions or 15min idle
    const idleTime = Date.now() - sessionData.startTime.getTime();
    if (sessionData.questionsCount >= 10 || idleTime > 15 * 60 * 1000) {
      const durationMinutes = Math.floor(idleTime / (1000 * 60));
      
      // Emit session finished
      this.eventEmitter.emit('session.finished', {
        sessionId: gameSessionId,
        durationMinutes,
        accuracyRate: isCorrect ? 100 : 0, // Simplified (should aggregate all answers)
      });

      this.activeGameSessions.delete(sessionKey);
    }
  }

  // ... (keep updateQuestionStats and calculateNextReview)


  private async updateQuestionStats(
    questionId: string,
    score: number,
    timeTaken: number,
    isCorrect: boolean,
    selfRating?: number,
  ) {
    try {
      const analytics = await this.prisma.questionAnalytics.findUnique({
        where: { questionId },
      });

      if (!analytics) {
        await this.prisma.questionAnalytics.create({
          data: {
            questionId,
            totalAttempts: 1,
            successRate: isCorrect ? 100 : 0,
            avgScore: score,
            avgTime: timeTaken,
            avgSelfRating: selfRating || null,
            commonMistakes: [],
            isDifficult: !isCorrect,
          },
        });
      } else {
        // Incremental update (could be moved to a background job for scaling)
        const total = analytics.totalAttempts + 1;
        const newAvgScore = (analytics.avgScore * analytics.totalAttempts + score) / total;
        const newAvgTime = (analytics.avgTime * analytics.totalAttempts + timeTaken) / total;
        
        // Success rate
        const successes = (analytics.successRate / 100) * analytics.totalAttempts + (isCorrect ? 1 : 0);
        const newSuccessRate = (successes / total) * 100;

        await this.prisma.questionAnalytics.update({
          where: { questionId },
          data: {
            totalAttempts: total,
            avgScore: newAvgScore,
            avgTime: Math.round(newAvgTime),
            successRate: newSuccessRate,
            isDifficult: newSuccessRate < 40, // Mark difficult if < 40% success
          },
        });
      }
      
      // Also update the QuestionBank metadata
      await this.prisma.questionBank.update({
        where: { id: questionId },
        data: {
          timesUsed: { increment: 1 },
          avgScore: score, // Simplified, keeping sync
        },
      });

    } catch (error) {
      this.logger.error(`Failed to update stats for question ${questionId}: ${error.message}`);
    }
  }

  private calculateNextReview(rating: number): Date {
    // Basic Spaced Repetition Logic (1=Hard, 2=Good, 3=Easy)
    const now = new Date();
    switch (rating) {
      case 1: return new Date(now.setDate(now.getDate() + 1)); // 1 day
      case 2: return new Date(now.setDate(now.getDate() + 3)); // 3 days
      case 3: return new Date(now.setDate(now.getDate() + 7)); // 7 days
      default: return new Date(now.setDate(now.getDate() + 1));
    }
  }



}
