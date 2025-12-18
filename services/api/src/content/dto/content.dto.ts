import { IsEnum, IsNotEmpty, IsOptional, IsString, IsJSON } from 'class-validator';
import { ContentType, Language } from '@prisma/client';

export class CreateContentDto {
  @IsNotEmpty()
  @IsString()
  title!: string;

  @IsNotEmpty()
  @IsEnum(ContentType)
  type!: ContentType;

  @IsOptional()
  @IsString()
  sourceId?: string;

  @IsNotEmpty()
  @IsEnum(Language)
  originalLanguage!: Language;

  @IsNotEmpty()
  @IsString()
  rawText!: string;

  @IsOptional()
  metadata?: any; // JSON
}

export class UpdateContentDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsEnum(ContentType)
  type?: ContentType;

  @IsOptional()
  @IsString()
  sourceId?: string;

  @IsOptional()
  @IsEnum(Language)
  originalLanguage?: Language;

  @IsOptional()
  @IsString()
  rawText?: string;

  @IsOptional()
  metadata?: any;
}
