import { IsString, IsOptional, IsEnum } from 'class-validator';
import { AnnotationType } from '@prisma/client';

export class CreateReplyDto {
  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsString()
  color?: string;
}
