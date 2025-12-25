import { IsString, IsEnum, IsOptional } from "class-validator";
import { Language, ScopeType } from "@prisma/client";

export class UploadContentDto {
  @IsString()
  title: string;

  @IsEnum(Language)
  originalLanguage: Language;

  @IsOptional()
  @IsEnum(ScopeType)
  scopeType?: ScopeType;

  @IsOptional()
  @IsString()
  scopeId?: string;
}
