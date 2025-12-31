import {
  IsArray,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
} from "class-validator";

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
  @IsEnum(["TEXT", "AREA"])
  kind: "TEXT" | "AREA";

  @IsEnum(["PDF", "IMAGE", "DOCX"])
  target_type: "PDF" | "IMAGE" | "DOCX";

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

  @IsOptional()
  @IsInt()
  timestamp_ms?: number;

  @IsOptional()
  @IsInt()
  duration_ms?: number;

  @IsOptional()
  @IsString()
  visibility?: string;

  @IsOptional()
  @IsString()
  visibility_scope?: string;

  @IsOptional()
  @IsString()
  context_type?: string;

  @IsOptional()
  @IsString()
  context_id?: string;

  @IsOptional()
  @IsString()
  learner_id?: string;
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

export class CreateContentDto {
  @IsString()
  title: string;

  @IsEnum(["PDF", "IMAGE", "DOCX", "VIDEO", "AUDIO", "TEXT"])
  type: "PDF" | "IMAGE" | "DOCX" | "VIDEO" | "AUDIO" | "TEXT";

  @IsString()
  @IsOptional()
  originalLanguage?: string;

  @IsString()
  @IsOptional()
  rawText?: string;

  @IsInt()
  @IsOptional()
  duration?: number;

  @IsString()
  @IsOptional()
  thumbnailUrl?: string;

  @IsString()
  @IsOptional()
  sourceUrl?: string;
}

export class UpdateContentDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsInt()
  duration?: number;

  @IsOptional()
  metadata?: Record<string, any>;
}
