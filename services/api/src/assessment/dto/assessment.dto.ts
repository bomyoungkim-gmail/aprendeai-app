import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsArray,
  IsEnum,
} from "class-validator";
import { QuestionType } from "@prisma/client";

export class CreateQuestionDto {
  @IsNotEmpty()
  @IsEnum(QuestionType)
  questionType!: QuestionType;

  @IsNotEmpty()
  @IsString()
  questionText!: string;

  @IsOptional()
  @IsArray()
  options?: string[];

  @IsNotEmpty()
  correctAnswer!: any; // Index or text
}

export class CreateAssessmentDto {
  @IsNotEmpty()
  @IsString()
  contentId!: string;

  @IsOptional()
  @IsString()
  contentVersionId?: string;

  @IsNotEmpty()
  @IsString()
  schoolingLevelTarget!: string;

  @IsNotEmpty()
  @IsArray()
  questions!: CreateQuestionDto[];
}

export class SubmitAssessmentAnswerDto {
  @IsNotEmpty()
  @IsString()
  questionId!: string;

  @IsNotEmpty()
  userAnswer!: any;

  @IsOptional()
  timeSpentSeconds?: number;
}

export class SubmitAssessmentDto {
  @IsNotEmpty()
  @IsArray()
  answers!: SubmitAssessmentAnswerDto[];

  @IsOptional()
  @IsString()
  sessionId?: string;
}
