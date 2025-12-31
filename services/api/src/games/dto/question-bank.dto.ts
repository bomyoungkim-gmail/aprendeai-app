import {
  IsString,
  IsInt,
  IsOptional,
  IsJSON,
  IsEnum,
  Min,
  Max,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export enum EducationLevel {
  FUNDAMENTAL = "fundamental",
  MEDIO = "medio",
  SUPERIOR = "superior",
}

export enum SourceType {
  AI_GENERATED = "AI_GENERATED",
  CURATED = "CURATED",
  USER_CONTRIBUTED = "USER_CONTRIBUTED",
}

export class CreateQuestionBankDto {
  @ApiProperty({ example: "pt-BR", description: "Question language code" })
  @IsString()
  language: string;

  @ApiProperty({
    example: "CONCEPT_LINKING",
    description: "Game type identifier",
  })
  @IsString()
  gameType: string;

  @ApiProperty({
    example: "Biologia",
    description: "Subject name in the language",
  })
  @IsString()
  subject: string;

  @ApiProperty({
    example: "Fotossíntese",
    description: "Topic name in the language",
  })
  @IsString()
  topic: string;

  @ApiProperty({
    example: 3,
    minimum: 1,
    maximum: 5,
    description: "Difficulty level 1-5",
  })
  @IsInt()
  @Min(1)
  @Max(5)
  difficulty: number;

  @ApiProperty({ enum: EducationLevel, example: EducationLevel.MEDIO })
  @IsEnum(EducationLevel)
  educationLevel: EducationLevel;

  @ApiProperty({ description: "Question content (format varies by game)" })
  @IsJSON()
  question: any;

  @ApiProperty({ description: "Answer content with evaluation criteria" })
  @IsJSON()
  answer: any;

  @ApiPropertyOptional({ description: "Additional metadata (tags, keywords)" })
  @IsOptional()
  @IsJSON()
  metadata?: any;

  @ApiProperty({ enum: SourceType, example: SourceType.AI_GENERATED })
  @IsEnum(SourceType)
  sourceType: SourceType;

  @ApiPropertyOptional({
    example: "clxyz123",
    description: "Library content ID if based on user material",
  })
  @IsOptional()
  @IsString()
  sourceContentId?: string;

  @ApiPropertyOptional({
    example: "photosynthesis",
    description: "Universal concept ID for linking translations",
  })
  @IsOptional()
  @IsString()
  universalConceptId?: string;
}

export class QuestionBankResponseDto {
  id: string;
  language: string;
  gameType: string;
  subject: string;
  topic: string;
  difficulty: number;
  educationLevel: string;
  question: any;
  answer: any;
  metadata?: any;
  sourceType: string;
  timesUsed: number;
  avgScore?: number;
  createdAt: Date;
  updatedAt: Date;
}

export class QuestionBankListDto {
  questions: QuestionBankResponseDto[];
  total: number;
  page: number;
  pageSize: number;
}
