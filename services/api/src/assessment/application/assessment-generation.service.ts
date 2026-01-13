import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { QuestionType, ContentMode } from "@prisma/client";
import { AiServiceClient } from "../../ai-service/ai-service.client";

/**
 * Assessment Generation Service
 *
 * Generates assessments from learning_assets (quiz_post_json or checkpoints_json)
 * Priority: quiz_post_json > checkpoints_json
 * Also supports dynamic context-aware generation from Cornell notes.
 */
@Injectable()
export class AssessmentGenerationService {
  private readonly logger = new Logger(AssessmentGenerationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiServiceClient,
  ) {}

  /**
   * Generate assessment from learning assets
   *
   * @param contentVersionId - The content version ID
   * @returns The created assessment ID
   */
  async generateFromAssets(contentVersionId: string): Promise<string> {
    this.logger.debug(
      `Generating assessment from assets for version ${contentVersionId}`,
    );

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
      throw new NotFoundException(
        `Content version ${contentVersionId} not found`,
      );
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
      throw new Error("No valid questions found in learning assets");
    }

    // 3. Check if assessment already exists
    const existingAssessment = await this.prisma.assessments.findFirst({
      where: {
        content_id: contentVersion.content_id,
        content_version_id: contentVersionId,
      },
    });

    if (existingAssessment) {
      this.logger.log(
        `Assessment already exists for version ${contentVersionId}, returning existing ID`,
      );
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

    this.logger.log(
      `Created assessment ${assessment.id} with ${questions.length} questions`,
    );
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
        type: (q.type as QuestionType) || "MULTIPLE_CHOICE",
        text: q.question || q.text || "",
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
        type: "MULTIPLE_CHOICE", // Default type for checkpoints
        text: checkpoint.question || checkpoint.text || "",
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

  // ==========================================
  // DYNAMIC GENERATION (Cornell Integration)
  // ==========================================

  /**
   * Generate a context-aware quiz based on scaffolding level and Cornell notes
   */
  async generateQuiz(
    contentId: string,
    userId: string,
    scaffoldingLevel: number,
    mode: ContentMode,
  ): Promise<any> {
    this.logger.debug(
      `Generating quiz for content ${contentId} (L${scaffoldingLevel}, ${mode})`,
    );

    // 1. Gather Context (Cornell Highlights)
    const context = await this.gatherContext(contentId, userId);

    if (!context.hasHighlights) {
      this.logger.warn(
        `No highlights found for content ${contentId}. Using raw text only.`,
      );
    }

    // 2. Determine Quiz Strategy based on Level
    const strategy = this.getStrategyForLevel(scaffoldingLevel);

    // 3. Build Prompt for LLM
    const prompt = this.buildPrompt(context, strategy, mode);

    // 4. Generate Questions via LLM
    const questions = await this.aiService.generateQuiz(prompt);

    return {
      questions,
      difficulty: strategy.difficulty,
      scaffoldingLevel,
      generatedAt: new Date(),
    };
  }

  private async gatherContext(contentId: string, userId: string) {
    // Fetch highlights (Evidence, Main Ideas, Doubts)
    const highlights = await this.prisma.highlights.findMany({
      where: {
        content_id: contentId,
        user_id: userId,
        type: { in: ["EVIDENCE", "MAIN_IDEA", "DOUBT"] },
      },
      select: {
        id: true,
        type: true,
        comment_text: true, // User's note
        anchor_json: true,
      },
    });

    // Separate highlights by type for strategic use
    const evidenceHighlights = highlights.filter((h) => h.type === "EVIDENCE");
    const mainIdeaHighlights = highlights.filter((h) => h.type === "MAIN_IDEA");
    const doubtHighlights = highlights.filter((h) => h.type === "DOUBT");

    // Format each type separately
    const formatHighlight = (h: any) => {
      const text = (h.anchor_json as any)?.text || "Content reference";
      const note = h.comment_text ? ` (Note: ${h.comment_text})` : "";
      return `${text}${note}`;
    };

    return {
      hasHighlights: highlights.length > 0,
      evidence: evidenceHighlights.map(formatHighlight),
      mainIdeas: mainIdeaHighlights.map(formatHighlight),
      doubts: doubtHighlights.map(formatHighlight),
      highlights,
    };
  }

  private getStrategyForLevel(level: number) {
    switch (level) {
      case 3: // High Scaffolding -> Easy
        return {
          type: "MULTIPLE_CHOICE",
          count: 3,
          difficulty: 0.3,
          focus: "RECOGNITION",
        };
      case 2: // Moderate
        return {
          type: "FILL_BLANK",
          count: 3,
          difficulty: 0.5,
          focus: "RECALL",
        };
      case 1: // Low
        return {
          type: "SHORT_ANSWER",
          count: 2,
          difficulty: 0.7,
          focus: "ANALYSIS",
        };
      case 0: // No Scaffolding -> Hard
        return {
          type: "ESSAY",
          count: 1,
          difficulty: 0.9,
          focus: "SYNTHESIS",
        };
      default:
        return {
          type: "MULTIPLE_CHOICE",
          count: 3,
          difficulty: 0.5,
          focus: "RECALL",
        };
    }
  }

  private buildPrompt(context: any, strategy: any, mode: ContentMode): string {
    // Build context sections based on highlight types
    let contextSection = "";

    if (context.doubts.length > 0) {
      contextSection += `\n**Areas of Confusion (Student marked as DOUBT)**:\n${context.doubts.map((d: string, i: number) => `${i + 1}. ${d}`).join("\n")}\n`;
    }

    if (context.evidence.length > 0) {
      contextSection += `\n**Key Evidence (Student highlighted)**:\n${context.evidence.map((e: string, i: number) => `${i + 1}. ${e}`).join("\n")}\n`;
    }

    if (context.mainIdeas.length > 0) {
      contextSection += `\n**Main Ideas (Student identified)**:\n${context.mainIdeas.map((m: string, i: number) => `${i + 1}. ${m}`).join("\n")}\n`;
    }

    // Strategic instructions based on highlight types
    let strategyInstructions = "";
    if (context.doubts.length > 0) {
      strategyInstructions +=
        "\n- PRIORITY: Create remedial/diagnostic questions targeting the areas marked as DOUBT to help clarify confusion.";
    }
    if (context.evidence.length > 0) {
      strategyInstructions +=
        "\n- Use EVIDENCE highlights for recognition and recall questions.";
    }
    if (context.mainIdeas.length > 0) {
      strategyInstructions +=
        "\n- Use MAIN_IDEA highlights for conceptual and analytical questions.";
    }

    return `
Generate a ${strategy.count}-question quiz for a student learning in ${mode} mode.

**Quiz Strategy**:
- Question Type: ${strategy.type}
- Difficulty Level (0-1): ${strategy.difficulty}
- Cognitive Focus: ${strategy.focus}${strategyInstructions}

**Student Context**:${contextSection || "\n(No highlights available - generate generic questions based on typical content for this mode)"}

**Output Format**:
Return a valid JSON array of questions. Each question must have:
- text: string (the question)
- options: string[] (for MULTIPLE_CHOICE) or null
- correctAnswer: string
- explanation: string (brief explanation of the correct answer)
- targetedHighlight: string (which highlight type this question addresses: "DOUBT", "EVIDENCE", "MAIN_IDEA", or "GENERIC")

Example:
[
  {
    "text": "What is the main concept discussed?",
    "options": ["A", "B", "C", "D"],
    "correctAnswer": "B",
    "explanation": "The text explicitly states...",
    "targetedHighlight": "MAIN_IDEA"
  }
]
    `.trim();
  }
}
