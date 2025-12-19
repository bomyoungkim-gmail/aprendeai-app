import { IsOptional, IsString, IsEnum, IsDateString, IsBoolean } from 'class-validator';
import { AnnotationType } from '@prisma/client';

export class SearchAnnotationsDto {
  @IsOptional()
  @IsString()
  query?: string;

  @IsOptional()
  @IsEnum(AnnotationType)
  type?: AnnotationType;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  contentId?: string;

  @IsOptional()
  @IsString()
  groupId?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsBoolean()
  isFavorite?: boolean;
}
