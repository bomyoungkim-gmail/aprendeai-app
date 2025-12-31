import {
  IsString,
  IsInt,
  IsBoolean,
  IsOptional,
  IsJSON,
  Min,
  Max,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class SubmitQuestionResultDto {
  @ApiProperty({
    example: "clxyz789",
    description: "Question ID that was answered",
  })
  @IsString()
  questionId: string;

  @ApiProperty({
    example: 85,
    minimum: 0,
    maximum: 100,
    description: "Score achieved (0-100)",
  })
  @IsInt()
  @Min(0)
  @Max(100)
  score: number;

  @ApiProperty({
    example: 45,
    minimum: 0,
    description: "Time taken in seconds",
  })
  @IsInt()
  @Min(0)
  timeTaken: number;

  @ApiProperty({ example: true, description: "Whether the answer was correct" })
  @IsBoolean()
  isCorrect: boolean;

  @ApiPropertyOptional({
    example: 2,
    minimum: 1,
    maximum: 3,
    description: "Self-assessment rating for SRS (1=Difícil, 2=Bom, 3=Fácil)",
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(3)
  selfRating?: number;

  @ApiPropertyOptional({ description: "User's submitted answer" })
  @IsOptional()
  @IsJSON()
  userAnswer?: any;

  @ApiPropertyOptional({
    description: "Mistakes made (e.g., forbidden words used)",
  })
  @IsOptional()
  @IsJSON()
  mistakes?: any;

  @ApiPropertyOptional({
    example: "session_123",
    description: "Game session ID for grouping",
  })
  @IsOptional()
  @IsString()
  gameSessionId?: string;
}

export class QuestionResultResponseDto {
  id: string;
  userId: string;
  questionId: string;
  score: number;
  timeTaken: number;
  isCorrect: boolean;
  selfRating?: number;
  createdAt: Date;
}

export class QuestionResultWithAnalyticsDto extends QuestionResultResponseDto {
  questionAnalytics: {
    totalAttempts: number;
    successRate: number;
    avgScore: number;
    isDifficult: boolean;
  };
  nextReviewDate?: Date; // For SRS
}
