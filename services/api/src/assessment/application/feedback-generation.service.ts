import { Injectable, Logger } from "@nestjs/common";
import { RedisService } from "../../common/redis/redis.service";
import { LLMService } from "../../llm/llm.service";

/**
 * Feedback Generation Service
 *
 * Generates actionable feedback for incorrect checkpoint answers.
 * Uses LLM for dynamic feedback generation with caching to reduce costs.
 */
@Injectable()
export class FeedbackGenerationService {
  private readonly logger = new Logger(FeedbackGenerationService.name);
  private readonly CACHE_TTL = 60 * 60 * 24 * 7; // 7 days

  constructor(
    private readonly redis: RedisService,
    private readonly llmService: LLMService,
  ) {}

  /**
   * Generate feedback for an incorrect answer
   *
   * @param question - The question object
   * @param userAnswer - The user's answer
   * @param correctAnswer - The correct answer
   * @returns Actionable feedback string
   */
  async generateFeedback(
    question: any,
    userAnswer: any,
    correctAnswer: any,
  ): Promise<string> {
    // 1. Check cache first
    const cacheKey = this.getCacheKey(question.id, userAnswer);
    const cached = await this.redis.get(cacheKey);

    if (cached) {
      this.logger.debug(`Cache hit for feedback: ${question.id}`);
      return cached as string;
    }

    // 2. Generate feedback using LLM
    const feedback = await this.generateLLMFeedback(
      question,
      userAnswer,
      correctAnswer,
    );

    // 3. Cache the feedback
    await this.redis.set(cacheKey, feedback, this.CACHE_TTL);

    return feedback;
  }

  /**
   * Generate LLM-based feedback
   * Uses a lightweight prompt to generate actionable explanations
   */
  private async generateLLMFeedback(
    question: any,
    userAnswer: any,
    correctAnswer: any,
  ): Promise<string> {
    const questionText = question.questionText || question.text || "";

    const prompt = `You are an educational assistant providing feedback on a checkpoint question.

Question: ${questionText}

Correct Answer: ${JSON.stringify(correctAnswer)}
Student's Answer: ${JSON.stringify(userAnswer)}

Provide a brief, actionable explanation (2-3 sentences max) explaining:
1. Why the student's answer is incorrect
2. A hint to help them understand the correct answer

Keep it encouraging and focused on learning.`;

    try {
      const response = await this.llmService.generateText(prompt, {
        maxTokens: 150,
        temperature: 0.7,
        model: "gpt-4o-mini", // Use lightweight model for cost efficiency
      });

      return response.text || this.getFallbackFeedback(question, correctAnswer);
    } catch (error) {
      this.logger.error(`LLM feedback generation failed: ${error.message}`);
      return this.getFallbackFeedback(question, correctAnswer);
    }
  }

  /**
   * Fallback feedback when LLM fails
   */
  private getFallbackFeedback(question: any, correctAnswer: any): string {
    const questionText = question.questionText || question.text || "";

    return `Not quite. The correct answer is: ${JSON.stringify(correctAnswer)}. 

Review the section related to "${questionText.substring(0, 50)}..." to better understand this concept.`;
  }

  /**
   * Generate cache key for feedback
   */
  private getCacheKey(questionId: string, userAnswer: any): string {
    const answerHash = JSON.stringify(userAnswer);
    return `feedback:${questionId}:${answerHash}`;
  }

  /**
   * Clear feedback cache for a specific question
   * Useful when question content is updated
   */
  async clearCache(questionId: string): Promise<void> {
    const pattern = `feedback:${questionId}:*`;
    // Note: This requires SCAN in production for large datasets
    // For now, we'll just log it
    this.logger.log(`Cache clear requested for pattern: ${pattern}`);
  }
}
