import { Controller, Post, Body } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { AssessmentGenerationService } from "./application/assessment-generation.service";
import { FeedbackGenerationService } from "./application/feedback-generation.service"; // Using existing service
import { ContentMode } from "@prisma/client";

export class GenerateQuizDto {
  contentId: string;
  userId: string;
  scaffoldingLevel: number;
  mode: ContentMode;
}

export class EvaluateAnswerDto {
  questionId: string;
  userAnswer: string;
  correctAnswer: any; // For MVP, pass correct answer if simpler, OR lookup (better)
  questionText?: string;
}

@ApiTags("assessments")
@Controller("assessments")
export class AssessmentController {
  constructor(
    private readonly generator: AssessmentGenerationService,
    private readonly feedback: FeedbackGenerationService,
  ) {}

  @Post("generate")
  @ApiOperation({ summary: "Generate a context-aware quiz" })
  async generate(@Body() dto: GenerateQuizDto) {
    return this.generator.generateQuiz(
      dto.contentId,
      dto.userId,
      dto.scaffoldingLevel,
      dto.mode,
    );
  }

  @Post("feedback")
  @ApiOperation({ summary: "Get feedback for an answer" })
  async getFeedback(@Body() dto: EvaluateAnswerDto) {
    // Construct simplified object for service
    return this.feedback.generateFeedback(
      { id: dto.questionId, text: dto.questionText },
      dto.userAnswer,
      dto.correctAnswer,
    );
  }
}
