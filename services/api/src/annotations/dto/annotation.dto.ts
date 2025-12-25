import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from "class-validator";
import { AnnotationType, AnnotationVisibility } from "@prisma/client";

export class CreateAnnotationDto {
  @IsEnum(AnnotationType)
  type: AnnotationType;

  @IsInt()
  @Min(0)
  startOffset: number;

  @IsInt()
  @Min(0)
  endOffset: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  selectedText?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10000)
  text?: string;

  @IsOptional()
  @IsString()
  color?: string; // yellow, green, blue, pink

  @IsEnum(AnnotationVisibility)
  visibility: AnnotationVisibility;

  @IsOptional()
  @IsString()
  groupId?: string;

  @IsOptional()
  @IsString()
  parentId?: string; // For comment replies
}

export class UpdateAnnotationDto {
  @IsString()
  @MaxLength(10000)
  text: string;
}
