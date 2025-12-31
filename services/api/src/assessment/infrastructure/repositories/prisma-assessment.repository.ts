import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { IAssessmentRepository } from "../../domain/interfaces/assessment.repository.interface";
import { Assessment } from "../../domain/entities/assessment.entity";
import { AssessmentAttempt } from "../../domain/entities/assessment-attempt.entity";
import { AssessmentQuestion } from "../../domain/entities/assessment-question.entity";
import { QuestionType } from "@prisma/client";

@Injectable()
export class PrismaAssessmentRepository implements IAssessmentRepository {
  constructor(private prisma: PrismaService) {}

  async create(assessment: Assessment): Promise<Assessment> {
    const created = await this.prisma.assessments.create({
      data: {
        id: assessment.id,
        content_id: assessment.contentId,
        content_version_id: assessment.contentVersionId,
        schooling_level_target: assessment.schoolingLevelTarget,
        updated_at: new Date(),
        assessment_questions: {
          create: assessment.questions?.map((q) => ({
            id: q.id,
            question_type: q.questionType as QuestionType,
            question_text: q.questionText,
            options: q.options,
            correct_answer: q.correctAnswer,
          })),
        },
      },
      include: {
        assessment_questions: true,
      },
    });

    return this.mapToDomain(created);
  }

  async findById(id: string): Promise<Assessment | null> {
    const found = await this.prisma.assessments.findUnique({
      where: { id },
      include: {
        assessment_questions: true,
      },
    });

    if (!found) return null;
    return this.mapToDomain(found);
  }

  async findAllByUser(userId: string): Promise<Assessment[]> {
    const found = await this.prisma.assessments.findMany({
      where: {
        contents: {
          owner_user_id: userId,
        },
      },
      include: {
        assessment_questions: true,
      },
      orderBy: { created_at: "desc" },
    });

    return found.map((a) => this.mapToDomain(a));
  }

  async createAttempt(
    attempt: AssessmentAttempt,
    answers: any[],
  ): Promise<AssessmentAttempt> {
    const created = await this.prisma.assessment_attempts.create({
      data: {
        id: attempt.id,
        assessment_id: attempt.assessmentId,
        user_id: attempt.userId,
        score_raw: attempt.scoreRaw,
        score_percent: attempt.scorePercent,
        finished_at: attempt.finishedAt,
        assessment_answers: {
          create: answers.map((a) => ({
            id: a.id,
            question_id: a.questionId,
            user_answer: a.userAnswer,
            is_correct: a.isCorrect,
            time_spent_seconds: a.timeSpentSeconds,
          })),
        },
      },
    });

    return new AssessmentAttempt({
      id: created.id,
      assessmentId: created.assessment_id,
      userId: created.user_id,
      scoreRaw: created.score_raw,
      scorePercent: created.score_percent || 0,
      finishedAt: created.finished_at,
      createdAt: (created as any).created_at || new Date(),
    });
  }

  private mapToDomain(prismaAssessment: any): Assessment {
    const questions = prismaAssessment.assessment_questions?.map(
      (q: any) =>
        new AssessmentQuestion({
          id: q.id,
          assessmentId: q.assessment_id,
          questionType: q.question_type,
          questionText: q.question_text,
          options: q.options,
          correctAnswer: q.correct_answer,
          createdAt: q.created_at,
        }),
    );

    return new Assessment({
      id: prismaAssessment.id,
      contentId: prismaAssessment.content_id,
      contentVersionId: prismaAssessment.content_version_id,
      schoolingLevelTarget: prismaAssessment.schooling_level_target,
      createdAt: prismaAssessment.created_at,
      updatedAt: prismaAssessment.updated_at,
      questions,
    });
  }
}
