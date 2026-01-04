import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { QuestionType } from '@prisma/client';

/**
 * Assessment Generation Service
 * 
 * Generates assessments from learning_assets (quiz_post_json or checkpoints_json)
 * Priority: quiz_post_json > checkpoints_json
 */
@Injectable()
export class AssessmentGenerationService {
  private readonly logger = new Logger(AssessmentGenerationService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate assessment from learning assets
   * 
   * @param contentVersionId - The content version ID
   * @returns The created assessment ID
   */
  async generateFromAssets(contentVersionId: string): Promise<string> {
    this.logger.debug(`Generating assessment from assets for version ${contentVersionId}`);

    // 1. Fetch content version and associated learning assets
    const contentVersion = await this.prisma.content_versions.findUnique({
      where: { id: contentVersionId },
      include: {
        contents: {
          include: {
            learning_assets: {
              where: {
                OR: [
                  { quiz_post_json: { not: null } },
                  { checkpoints_json: { not: null } },
                ],
              },
            },
          },
        },
      },
    });

    if (!contentVersion) {
      throw new NotFoundException(`Content version ${contentVersionId} not found`);
    }

    const assets = contentVersion.contents.learning_assets;

    if (assets.length === 0) {
      throw new NotFoundException(
        `No learning assets with quiz_post_json or checkpoints_json found for content version ${contentVersionId}`,
      );
    }

    // 2. Extract questions (Priority: quiz_post_json > checkpoints_json)
    const questions = this.extractQuestions(assets);

    if (questions.length === 0) {
      throw new Error('No valid questions found in learning assets');
    }

    // 3. Check if assessment already exists
    const existingAssessment = await this.prisma.assessments.findFirst({
      where: {
        content_id: contentVersion.content_id,
        content_version_id: contentVersionId,
      },
    });

    if (existingAssessment) {
      this.logger.log(`Assessment already exists for version ${contentVersionId}, returning existing ID`);
      return existingAssessment.id;
    }

    // 4. Create assessment
    const assessment = await this.prisma.assessments.create({
      data: {
        id: this.generateAssessmentId(),
        content_id: contentVersion.content_id,
        content_version_id: contentVersionId,
        schooling_level_target: contentVersion.schooling_level_target,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    // 5. Create assessment questions
    for (const question of questions) {
      await this.prisma.assessment_questions.create({
        data: {
          id: this.generateQuestionId(),
          assessment_id: assessment.id,
          question_type: question.type,
          question_text: question.text,
          options: question.options || null,
          correct_answer: question.correctAnswer,
          skills: question.skills || [],
        },
      });
    }

    this.logger.log(`Created assessment ${assessment.id} with ${questions.length} questions`);
    return assessment.id;
  }

  /**
   * Extract questions from learning assets
   * Priority: quiz_post_json > checkpoints_json
   */
  private extractQuestions(assets: any[]): Array<{
    type: QuestionType;
    text: string;
    options?: any;
    correctAnswer: any;
    skills?: string[];
  }> {
    const questions: Array<{
      type: QuestionType;
      text: string;
      options?: any;
      correctAnswer: any;
      skills?: string[];
    }> = [];

    for (const asset of assets) {
      // Priority 1: quiz_post_json
      if (asset.quiz_post_json) {
        const quizData = asset.quiz_post_json as any;
        const quizQuestions = this.parseQuizPostJson(quizData);
        questions.push(...quizQuestions);
      }
      // Priority 2: checkpoints_json (fallback)
      else if (asset.checkpoints_json) {
        const checkpointsData = asset.checkpoints_json as any;
        const checkpointQuestions = this.parseCheckpointsJson(checkpointsData);
        questions.push(...checkpointQuestions);
      }
    }

    return questions;
  }

  /**
   * Parse quiz_post_json format
   */
  private parseQuizPostJson(quizData: any): Array<{
    type: QuestionType;
    text: string;
    options?: any;
    correctAnswer: any;
    skills?: string[];
  }> {
    const questions: Array<{
      type: QuestionType;
      text: string;
      options?: any;
      correctAnswer: any;
      skills?: string[];
    }> = [];

    // Assume quiz_post_json has a 'questions' array
    const quizQuestions = Array.isArray(quizData.questions)
      ? quizData.questions
      : Array.isArray(quizData)
      ? quizData
      : [];

    for (const q of quizQuestions) {
      questions.push({
        type: (q.type as QuestionType) || 'MULTIPLE_CHOICE',
        text: q.question || q.text || '',
        options: q.options || null,
        correctAnswer: q.answer || q.correctAnswer || q.correct_answer || null,
        skills: q.skills || [],
      });
    }

    return questions;
  }

  /**
   * Parse checkpoints_json format
   */
  private parseCheckpointsJson(checkpointsData: any): Array<{
    type: QuestionType;
    text: string;
    options?: any;
    correctAnswer: any;
    skills?: string[];
  }> {
    const questions: Array<{
      type: QuestionType;
      text: string;
      options?: any;
      correctAnswer: any;
      skills?: string[];
    }> = [];

    // Assume checkpoints_json has a 'checkpoints' array
    const checkpoints = Array.isArray(checkpointsData.checkpoints)
      ? checkpointsData.checkpoints
      : Array.isArray(checkpointsData)
      ? checkpointsData
      : [];

    for (const checkpoint of checkpoints) {
      questions.push({
        type: 'MULTIPLE_CHOICE', // Default type for checkpoints
        text: checkpoint.question || checkpoint.text || '',
        options: checkpoint.options || null,
        correctAnswer: checkpoint.answer || checkpoint.correctAnswer || null,
        skills: checkpoint.skills || [],
      });
    }

    return questions;
  }

  /**
   * Generate a unique assessment ID
   */
  private generateAssessmentId(): string {
    return `assess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Generate a unique question ID
   */
  private generateQuestionId(): string {
    return `q_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}
