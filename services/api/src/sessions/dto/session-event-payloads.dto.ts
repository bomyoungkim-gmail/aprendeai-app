import {
  IsString,
  IsEnum,
  IsNumber,
  IsArray,
  IsOptional,
  Min,
  Max,
} from 'class-validator';

// MARK_UNKNOWN_WORD Payload
export class MarkUnknownWordPayloadDto {
  @IsString()
  word: string;

  @IsEnum(['PT', 'EN', 'KO'])
  language: 'PT' | 'EN' | 'KO';

  @IsEnum(['SKIM', 'READ'])
  origin: 'SKIM' | 'READ';

  @IsOptional()
  @IsString()
  blockId?: string;

  @IsOptional()
  @IsString()
  chunkId?: string;

  @IsOptional()
  @IsNumber()
  page?: number;

  @IsOptional()
  span?: { start: number; end: number } | string;

  @IsOptional()
  @IsString()
  note?: string;
}

// MARK_KEY_IDEA Payload
export class MarkKeyIdeaPayloadDto {
  @IsString()
  blockId: string;

  @IsString()
  excerpt: string;

  @IsOptional()
  @IsString()
  note?: string;
}

// CHECKPOINT_RESPONSE Payload
export class CheckpointResponsePayloadDto {
  @IsString()
  blockId: string;

  @IsString()
  questionId: string;

  @IsOptional()
  @IsString()
  questionText?: string;

  @IsString()
  answerText: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  confidence?: number;

  @IsOptional()
  rubric?: {
    comprehension?: number;
    inference?: number;
  };
}

// QUIZ_RESPONSE Payload
export class QuizResponsePayloadDto {
  @IsString()
  quizId: string;

  @IsString()
  questionId: string;

  @IsString()
  answerText: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  confidence?: number;
}

// PRODUCTION_SUBMIT Payload
export class ProductionSubmitPayloadDto {
  @IsEnum(['FREE_RECALL', 'SENTENCES', 'ORAL', 'OPEN_DIALOGUE'])
  type: 'FREE_RECALL' | 'SENTENCES' | 'ORAL' | 'OPEN_DIALOGUE';

  @IsString()
  text: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  usedWords?: string[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  confidence?: number;
}
