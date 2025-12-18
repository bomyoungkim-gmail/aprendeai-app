import { IsArray, IsEnum, IsInt, IsObject, IsOptional, IsString } from 'class-validator';

export class UpdateCornellDto {
  @IsArray()
  @IsOptional()
  cues_json?: any[];

  @IsArray()
  @IsOptional()
  notes_json?: any[];

  @IsString()
  @IsOptional()
  summary_text?: string;
}

export class CreateHighlightDto {
  @IsEnum(['TEXT', 'AREA'])
  kind: 'TEXT' | 'AREA';

  @IsEnum(['PDF', 'IMAGE', 'DOCX'])
  target_type: 'PDF' | 'IMAGE' | 'DOCX';

  @IsOptional()
  @IsInt()
  page_number?: number;

  @IsObject()
  anchor_json: any;

  @IsString()
  @IsOptional()
  color_key?: string;

  @IsString()
  @IsOptional()
  comment_text?: string;

  @IsArray()
  @IsOptional()
  tags_json?: string[];
}

export class UpdateHighlightDto {
  @IsString()
  @IsOptional()
  color_key?: string;

  @IsString()
  @IsOptional()
  comment_text?: string;

  @IsArray()
  @IsOptional()
  tags_json?: string[];
}
