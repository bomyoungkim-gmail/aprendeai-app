import {
  IsString,
  IsInt,
  IsEnum,
  Min,
  Max,
  IsIn,
  IsOptional,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { EducationLevel } from "./question-bank.dto";

// SCRIPT 01: Game type constants (existing + new syntax-related types)
export const GAME_TYPES = [
  // Existing game types
  "CONCEPT_LINKING",
  "SRS_ARENA",
  "FREE_RECALL_SCORE",
  // New syntax analysis game types (SCRIPT 01)
  "SENTENCE_SKELETON",
  "CONNECTOR_CLASSIFIER",
  "CLAUSE_REWRITE_SIMPLE",
] as const;

export type GameType = (typeof GAME_TYPES)[number];

export class GenerateQuestionsDto {
  @ApiProperty({
    example: "SENTENCE_SKELETON",
    description: "Type of game to generate questions for",
    enum: GAME_TYPES,
  })
  @IsIn(GAME_TYPES)
  gameType: GameType;

  @ApiProperty({
    example: "Fotossíntese",
    description: "Topic to generate questions about",
  })
  @IsString()
  topic: string;

  @ApiProperty({ example: "Biologia", description: "Subject area" })
  @IsString()
  subject: string;

  @ApiProperty({ enum: EducationLevel, example: EducationLevel.MEDIO })
  @IsEnum(EducationLevel)
  educationLevel: EducationLevel;

  @ApiProperty({
    example: 5,
    minimum: 1,
    description: "Number of questions to generate",
  })
  @IsInt()
  @Min(1)
  count: number;

  @ApiPropertyOptional({
    example: "pt-BR",
    description: "Target language (default: pt-BR)",
  })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional({
    example: 3,
    minimum: 1,
    maximum: 5,
    description: "Target difficulty (1-5)",
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  difficulty?: number;
}

export class GeneratedQuestionsResponseDto {
  questions: any[];
  generated: number;
  saved: number;
  language: string;
  gameType: GameType;
}
