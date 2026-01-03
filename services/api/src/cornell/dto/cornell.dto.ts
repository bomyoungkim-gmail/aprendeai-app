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
  notes_json?: any[];

  @IsString()
  @IsOptional()
  summary_text?: string;
}


import { CornellType } from "../constants/cornell-type-map";

export class UpdateHighlightDto {
  @IsString()
  @IsOptional()
  color_key?: string;

  @IsString()
  @IsOptional()
  comment_text?: string;

  @IsEnum(["EVIDENCE", "VOCABULARY", "MAIN_IDEA", "DOUBT", "SYNTHESIS"], {
    message: "Type must be valid Cornell Type (EVIDENCE, VOCABULARY, etc)",
  })
  @IsOptional()
  type?: CornellType;

  @IsArray()
  @IsOptional()
  tags_json?: string[];
}

export class CreateContentDto {
  @IsString()
  title: string;

  @IsEnum([
    "PDF",
    "IMAGE",
    "DOCX",
    "VIDEO",
    "AUDIO",
    "TEXT",
    "ARTICLE",
    "NEWS",
    "ARXIV",
    "SCHOOL_MATERIAL",
    "WEB_CLIP",
  ])
  type:
    | "PDF"
    | "IMAGE"
    | "DOCX"
    | "VIDEO"
    | "AUDIO"
    | "TEXT"
    | "ARTICLE"
    | "NEWS"
    | "ARXIV"
    | "SCHOOL_MATERIAL"
    | "WEB_CLIP";

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
