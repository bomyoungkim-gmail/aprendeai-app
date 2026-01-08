/**
 * DTO for creating Cornell Notes highlights
 *
 * Supports multiple media types (PDF, Image, Video, Audio) with conditional anchoring.
 * Uses centralized enums for type safety.
 *
 * @module cornell/dto
 */

import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsObject,
  ValidateIf,
  Min,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  AnnotationVisibility,
  VisibilityScope,
  ContextType,
  ContentType,
} from "../../common/constants/enums";
import {
  CornellType,
  getColorForType,
  getTagsForType,
} from "../constants/cornell-type-map";

/**
 * Geometry for area-based highlights (PDF, Image)
 */
export interface AnchorGeometry {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * DTO for creating a Cornell highlight
 */
export class CreateCornellHighlightDto {
  @ApiProperty({
    enum: ["EVIDENCE", "VOCABULARY", "MAIN_IDEA", "DOUBT"],
    description: "Cornell annotation type",
    example: "VOCABULARY",
  })
  @IsEnum(["EVIDENCE", "VOCABULARY", "MAIN_IDEA", "DOUBT"], {
    message: "Type must be one of: EVIDENCE, VOCABULARY, MAIN_IDEA, DOUBT",
  })
  type: Exclude<CornellType, "SYNTHESIS" | "AI_RESPONSE">;

  @ApiPropertyOptional({
    enum: ["TEXT", "AREA"],
    description: "Highlight kind (optional, auto-inferred from target_type if not provided)",
    example: "TEXT",
  })
  @IsOptional()
  @IsEnum(["TEXT", "AREA"])
  kind?: "TEXT" | "AREA";

  @ApiProperty({
    enum: ContentType,
    description: "Media type being annotated",
    example: "PDF",
  })
  @IsEnum(ContentType, {
    message: "Target type must be PDF, IMAGE, DOCX, VIDEO, or AUDIO",
  })
  target_type: ContentType;

  // ========================================
  // CONDITIONAL ANCHORING
  // ========================================

  @ApiPropertyOptional({
    description: "Page number (required for PDF/DOCX)",
    example: 1,
    minimum: 1,
  })
  @ValidateIf(
    (o) =>
      o.target_type === ContentType.PDF || o.target_type === ContentType.DOCX,
  )
  @IsInt()
  @Min(1)
  page_number?: number;

  @ApiPropertyOptional({
    description: "Anchor geometry (required for PDF/IMAGE)",
    example: { x: 100, y: 200, width: 150, height: 50 },
  })
  @ValidateIf(
    (o) =>
      o.target_type === ContentType.PDF || o.target_type === ContentType.IMAGE,
  )
  @IsObject()
  anchor_json?: AnchorGeometry;

  @ApiPropertyOptional({
    description: "Timestamp in milliseconds (required for VIDEO/AUDIO)",
    example: 30000,
    minimum: 0,
  })
  @ValidateIf(
    (o) =>
      o.target_type === ContentType.VIDEO || o.target_type === ContentType.AUDIO,
  )
  @IsInt()
  @Min(0)
  timestamp_ms?: number;

  @ApiPropertyOptional({
    description: "Duration in milliseconds (optional for VIDEO/AUDIO)",
    example: 5000,
    minimum: 0,
  })
  @ValidateIf(
    (o) =>
      o.target_type === ContentType.VIDEO || o.target_type === ContentType.AUDIO,
  )
  @IsOptional()
  @IsInt()
  @Min(0)
  duration_ms?: number;

  // ========================================
  // ANNOTATION CONTENT
  // ========================================

  @ApiPropertyOptional({
    description: "Comment/note text",
    example: "This is an important concept about photosynthesis",
  })
  @IsOptional()
  @IsString()
  comment_text?: string;

  // ========================================
  // GRANULAR SHARING
  // ========================================

  @ApiPropertyOptional({
    enum: AnnotationVisibility,
    description: "Visibility level",
    default: AnnotationVisibility.PRIVATE,
  })
  @IsOptional()
  @IsEnum(AnnotationVisibility)
  visibility?: AnnotationVisibility;

  @ApiPropertyOptional({
    enum: VisibilityScope,
    description: "Granular scope (required if visibility is GROUP)",
  })
  @ValidateIf((o) => o.visibility === AnnotationVisibility.GROUP)
  @IsEnum(VisibilityScope)
  visibility_scope?: VisibilityScope;

  @ApiPropertyOptional({
    enum: ContextType,
    description: "Context type (required if visibility is GROUP)",
  })
  @ValidateIf((o) => o.visibility === AnnotationVisibility.GROUP)
  @IsEnum(ContextType)
  context_type?: ContextType;

  @ApiPropertyOptional({
    description: "Context ID (required if visibility is GROUP)",
    example: "institution-123",
  })
  @ValidateIf((o) => o.visibility === AnnotationVisibility.GROUP)
  @IsString()
  context_id?: string;

  @ApiPropertyOptional({
    description: "Learner ID (required for RESPONSIBLES_OF_LEARNER scope)",
    example: "user-456",
  })
  @ValidateIf(
    (o) => o.visibility_scope === VisibilityScope.RESPONSIBLES_OF_LEARNER,
  )
  @IsString()
  learner_id?: string;

  // ========================================
  // AUTO-COMPUTED FIELDS
  // ========================================

  /**
   * Auto-computed color key based on Cornell type
   * Should not be provided in request
   */
  get color_key(): string {
    return getColorForType(this.type);
  }

  /**
   * Semantic tags (optional, can be auto-computed or provided)
   */
  @ApiPropertyOptional({
    description: "Semantic tags",
    example: ["vocab"],
  })
  @IsOptional()
  @IsString({ each: true })
  tags_json?: string[];
}

/**
 * DTO for updating highlight visibility
 */
export class UpdateHighlightVisibilityDto {
  @ApiProperty({ enum: AnnotationVisibility })
  @IsEnum(AnnotationVisibility)
  visibility: AnnotationVisibility;

  @ApiPropertyOptional({ enum: VisibilityScope })
  @IsOptional()
  @IsEnum(VisibilityScope)
  visibility_scope?: VisibilityScope;

  @ApiPropertyOptional({ enum: ContextType })
  @IsOptional()
  @IsEnum(ContextType)
  context_type?: ContextType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  context_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  learner_id?: string;
}

/**
 * DTO for creating annotation comment (thread)
 */
export class CreateAnnotationCommentDto {
  @ApiProperty({
    description: "Comment text",
    example: "I agree with this point",
  })
  @IsString()
  text: string;
}
