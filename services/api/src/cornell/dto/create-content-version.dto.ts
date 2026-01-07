import { IsString, IsOptional, IsObject } from 'class-validator';

/**
 * DTO for creating content versions (simplified text)
 * Used by content_processor worker
 */
export class CreateContentVersionDto {
  @IsString()
  targetLanguage: string;

  @IsString()
  schoolingLevelTarget: string;

  @IsString()
  simplifiedText: string;

  @IsString()
  @IsOptional()
  summary?: string;

  @IsObject()
  @IsOptional()
  vocabularyGlossary?: Record<string, any>;
}
