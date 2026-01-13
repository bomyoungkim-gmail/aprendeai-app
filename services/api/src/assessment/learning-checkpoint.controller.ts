import { Controller, Post, Body, UseGuards, Request } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import {
  AnswerCheckpointUseCase,
  AnswerCheckpointDto,
} from "./application/use-cases/answer-checkpoint.use-case";

/**
 * Learning Checkpoint Controller
 *
 * Handles granular checkpoint interactions for micro-learning.
 * Separate from AssessmentController which handles full assessments.
 */
@Controller("learning/checkpoint")
@UseGuards(AuthGuard("jwt"))
export class LearningCheckpointController {
  constructor(
    private readonly answerCheckpointUseCase: AnswerCheckpointUseCase,
  ) {}

  /**
   * Answer a single checkpoint question
   *
   * POST /learning/checkpoint/answer
   */
  @Post("answer")
  async answer(@Request() req: any, @Body() dto: AnswerCheckpointDto) {
    return this.answerCheckpointUseCase.execute(req.user.id, dto);
  }
}
