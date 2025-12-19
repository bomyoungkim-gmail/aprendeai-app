import { IsString, IsOptional, IsArray } from 'class-validator';

export class UpdatePromptDto {
  @IsString()
  promptText: string;

  @IsOptional()
  @IsArray()
  options?: string[];

  @IsOptional()
  @IsArray()
  linkedHighlightIds?: string[];
}
