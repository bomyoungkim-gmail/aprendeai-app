import { IsNotEmpty, IsString, IsEnum, IsOptional, IsJSON } from 'class-validator';
import { Language } from '@prisma/client';

export class CreateContentVersionDto {
  @IsNotEmpty()
  @IsEnum(Language)
  targetLanguage!: Language;

  @IsNotEmpty()
  @IsString()
  schoolingLevelTarget!: string;

  @IsNotEmpty()
  @IsString()
  simplifiedText!: string;

  @IsOptional()
  @IsString()
  summary?: string;

  @IsOptional()
  vocabularyGlossary?: any;
}
