import {
  IsEnum,
  IsString,
  IsOptional,
  IsNumber,
  IsObject,
  IsArray,
} from "class-validator";
import {
  ItemType,
  BloomTaxonomy,
  Language,
  ScopeType,
  ItemVisibility,
} from "@prisma/client";

export class CreateItemDto {
  @IsEnum(ItemType)
  type: ItemType;

  @IsString()
  text: string;

  @IsOptional()
  @IsObject()
  options?: any;

  @IsOptional()
  @IsObject()
  correct_answer?: any;

  @IsOptional()
  @IsString()
  explanation?: string;

  @IsEnum(Language)
  language: Language;

  @IsOptional()
  @IsNumber()
  difficulty?: number;

  @IsOptional()
  @IsEnum(BloomTaxonomy)
  bloom_level?: BloomTaxonomy;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsObject()
  metadata?: any;

  // Isolation & Visibility (Security Fix - Issue #1)
  @IsOptional()
  @IsEnum(ScopeType)
  scopeType?: ScopeType; // ✅ camelCase

  @IsOptional()
  @IsString()
  scopeId?: string; // ✅ camelCase

  @IsOptional()
  @IsEnum(ItemVisibility)
  visibility?: ItemVisibility;

  @IsOptional()
  @IsString()
  createdBy?: string; // ✅ camelCase
}
