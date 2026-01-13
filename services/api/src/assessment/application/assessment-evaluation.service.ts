import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { AiServiceClient } from "../../ai-service/ai-service.client";
import { QuestionType } from "@prisma/client";

/**
 * Assessment Evaluation Service
 *
 * Evaluates student answers and calculates scores.
 * Uses LLM for semantic evaluation of open-ended questions.
 *
 * Following best practices:
 * - Application layer (orchestration)
 * - Clear DTOs for input/output
 * - Persistence via Prisma
 */

export interface EvaluationResult {
  score: number; // 0-1 scale
  isCorrect: boolean;
  feedback: string;
  evaluatedAt: Date;
}

@Injectable()
export class AssessmentEvaluationService {
  private readonly logger = new Logger(AssessmentEvaluationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiServiceClient,
  ) {}

  /**
   * Evaluate a student's answer to a question
   *
   * @param attemptId - The assessment attempt ID
   * @param questionId - The question ID
   * @param studentAnswer - The student's answer
   * @returns Evaluation result with score and feedback
   */
  async evaluateAnswer(
    attemptId: string,
    questionId: string,
    studentAnswer: string,
  ): Promise<EvaluationResult> {
    this.logger.debug(`Evaluating answer for question ${questionId}`);

    // 1. Fetch question details
    const question = await this.prisma.assessment_questions.findUnique({
      where: { id: questionId },
      select: {
        question_type: true,
        question_text: true,
        correct_answer: true,
        options: true,
      },
    });

    if (!question) {
      throw new NotFoundException(`Question ${questionId} not found`);
    }

    // 2. Evaluate based on question type
    let result: EvaluationResult;

    switch (question.question_type) {
      case "MULTIPLE_CHOICE":
      case "TRUE_FALSE":
        result = this.evaluateExactMatch(
          studentAnswer,
          question.correct_answer as string,
        );
        break;

      case "SHORT_ANSWER":
        // SHORT_ANSWER can be either fill-blank style or open-ended
        // Use heuristic: if correct answer is short (< 50 chars), treat as fill-blank
        if ((question.correct_answer as string).length < 50) {
          result = this.evaluateFillBlank(
            studentAnswer,
            question.correct_answer as string,
          );
        } else {
          result = await this.evaluateOpenEnded(
            studentAnswer,
            question.correct_answer as string,
            question.question_text,
            question.question_type,
          );
        }
        break;

      default:
        throw new Error(`Unsupported question type: ${question.question_type}`);
    }

    // 3. Persist evaluation result
    await this.persistEvaluation(attemptId, questionId, studentAnswer, result);

    this.logger.log(
      `Question ${questionId} evaluated: score=${result.score.toFixed(2)}`,
    );
    return result;
  }

  /**
   * Evaluate exact match (Multiple Choice, True/False)
   */
  private evaluateExactMatch(
    studentAnswer: string,
    correctAnswer: string,
  ): EvaluationResult {
    const normalized = (str: string) => str.trim().toLowerCase();
    const isCorrect = normalized(studentAnswer) === normalized(correctAnswer);

    return {
      score: isCorrect ? 1.0 : 0.0,
      isCorrect,
      feedback: isCorrect
        ? "Correct!"
        : `Incorrect. The correct answer is: ${correctAnswer}`,
      evaluatedAt: new Date(),
    };
  }

  /**
   * Evaluate fill-in-the-blank (partial matching)
   */
  private evaluateFillBlank(
    studentAnswer: string,
    correctAnswer: string,
  ): EvaluationResult {
    const normalized = (str: string) => str.trim().toLowerCase();
    const studentNorm = normalized(studentAnswer);
    const correctNorm = normalized(correctAnswer);

    // Exact match
    if (studentNorm === correctNorm) {
      return {
        score: 1.0,
        isCorrect: true,
        feedback: "Correct!",
        evaluatedAt: new Date(),
      };
    }

    // Partial match (contains correct answer)
    if (
      studentNorm.includes(correctNorm) ||
      correctNorm.includes(studentNorm)
    ) {
      return {
        score: 0.7,
        isCorrect: false,
        feedback: `Partially correct. Expected: ${correctAnswer}`,
        evaluatedAt: new Date(),
      };
    }

    return {
      score: 0.0,
      isCorrect: false,
      feedback: `Incorrect. The correct answer is: ${correctAnswer}`,
      evaluatedAt: new Date(),
    };
  }

  /**
   * Evaluate open-ended questions using LLM
   */
  private async evaluateOpenEnded(
    studentAnswer: string,
    correctAnswer: string,
    questionText: string,
    questionType: QuestionType,
  ): Promise<EvaluationResult> {
    const prompt = this.buildEvaluationPrompt(
      studentAnswer,
      correctAnswer,
      questionText,
      questionType,
    );

    try {
      const llmResponse = await this.aiService.evaluateAnswer(prompt);

      // Parse LLM response (expecting JSON with score and feedback)
      const evaluation = this.parseLLMEvaluation(llmResponse);

      return {
        score: evaluation.score,
        isCorrect: evaluation.score >= 0.7, // Threshold for "correct"
        feedback: evaluation.feedback,
        evaluatedAt: new Date(),
      };
    } catch (error) {
      this.logger.error(`LLM evaluation failed: ${error.message}`);

      // Fallback: simple keyword matching
      return this.fallbackEvaluation(studentAnswer, correctAnswer);
    }
  }

  /**
   * Build prompt for LLM evaluation
   */
  private buildEvaluationPrompt(
    studentAnswer: string,
    correctAnswer: string,
    questionText: string,
    questionType: QuestionType,
  ): string {
    return `
Evaluate the following student answer to a ${questionType} question.

**Question**: ${questionText}

**Expected Answer**: ${correctAnswer}

**Student Answer**: ${studentAnswer}

**Evaluation Criteria**:
${
  questionType === "SHORT_ANSWER"
    ? "- Depth of understanding\n- Clarity of explanation\n- Use of relevant examples\n- Logical structure"
    : "- Accuracy of key concepts\n- Completeness of answer"
}

**Output Format** (JSON):
{
  "score": 0.0-1.0,
  "feedback": "Detailed feedback explaining the score",
  "strengths": ["strength1", "strength2"],
  "improvements": ["improvement1", "improvement2"]
}
    `.trim();
  }

  /**
   * Parse LLM evaluation response
   */
  private parseLLMEvaluation(llmResponse: any): {
    score: number;
    feedback: string;
  } {
    try {
      // Assuming llmResponse.structuredOutput contains the JSON
      const parsed =
        typeof llmResponse === "string"
          ? JSON.parse(llmResponse)
          : llmResponse.structuredOutput || llmResponse;

      return {
        score: Math.max(0, Math.min(1, parsed.score || 0)),
        feedback: parsed.feedback || "No feedback provided",
      };
    } catch (error) {
      this.logger.warn(`Failed to parse LLM evaluation: ${error.message}`);
      return {
        score: 0.5,
        feedback: "Evaluation completed but feedback unavailable",
      };
    }
  }

  /**
   * Fallback evaluation (simple keyword matching)
   */
  private fallbackEvaluation(
    studentAnswer: string,
    correctAnswer: string,
  ): EvaluationResult {
    const studentWords = new Set(studentAnswer.toLowerCase().split(/\s+/));
    const correctWords = correctAnswer.toLowerCase().split(/\s+/);

    const matchCount = correctWords.filter((word) =>
      studentWords.has(word),
    ).length;
    const score = matchCount / correctWords.length;

    return {
      score: Math.max(0, Math.min(1, score)),
      isCorrect: score >= 0.7,
      feedback:
        score >= 0.7
          ? "Your answer demonstrates understanding of key concepts."
          : "Your answer is missing some key concepts. Please review the material.",
      evaluatedAt: new Date(),
    };
  }

  /**
   * Persist evaluation result to database
   */
  private async persistEvaluation(
    attemptId: string,
    questionId: string,
    studentAnswer: string,
    result: EvaluationResult,
  ): Promise<void> {
    // Check if attempt exists
    const attempt = await this.prisma.assessment_attempts.findUnique({
      where: { id: attemptId },
    });

    if (!attempt) {
      throw new NotFoundException(`Assessment attempt ${attemptId} not found`);
    }

    // Update attempt with answer and score
    // Following incremental evolution: use existing schema fields
    await this.prisma.assessment_attempts.update({
      where: { id: attemptId },
      data: {
        score_raw: result.score,
        score_percent: result.score * 100,
        finished_at: new Date(),
      },
    });
  }

  /**
   * Calculate overall assessment score
   *
   * @param attemptId - The assessment attempt ID
   * @returns Overall score (0-1)
   */
  async calculateOverallScore(attemptId: string): Promise<number> {
    const attempt = await this.prisma.assessment_attempts.findUnique({
      where: { id: attemptId },
      include: {
        assessments: {
          include: {
            assessment_questions: true,
          },
        },
      },
    });

    if (!attempt) {
      throw new NotFoundException(`Assessment attempt ${attemptId} not found`);
    }

    // If score is already calculated, return it
    if (attempt.score_raw !== null) {
      return attempt.score_raw;
    }

    // Otherwise, this would aggregate individual question scores
    // For now, return the stored score or 0
    return attempt.score_raw || 0;
  }
}
