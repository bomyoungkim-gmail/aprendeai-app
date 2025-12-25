import { IsString, IsInt, IsEnum, Min, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EducationLevel } from './question-bank.dto';

export class GenerateQuestionsDto {
  @ApiProperty({ example: 'CONCEPT_LINKING', description: 'Type of game to generate questions for' })
  @IsString()
  gameType: string;

  @ApiProperty({ example: 'Fotossíntese', description: 'Topic to generate questions about' })
  @IsString()
  topic: string;

  @ApiProperty({ example: 'Biologia', description: 'Subject area' })
  @IsString()
  subject: string;

  @ApiProperty({ enum: EducationLevel, example: EducationLevel.MEDIO })
  @IsEnum(EducationLevel)
  educationLevel: EducationLevel;

  @ApiProperty({ example: 5, minimum: 1, description: 'Number of questions to generate' })
  @IsInt()
  @Min(1)
  count: number;

  @ApiPropertyOptional({ example: 'pt-BR', description: 'Target language (default: pt-BR)' })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional({ example: 3, minimum: 1, maximum: 5, description: 'Target difficulty (1-5)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  difficulty?: number;
}

export class GeneratedQuestionsResponseDto {
  questions: any[];
  generated: number;
  saved: number;
  language: string;
  gameType: string;
}
