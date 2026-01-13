import {
  IsString,
  IsOptional,
  IsArray,
  IsEnum,
  IsBoolean,
} from "class-validator";

export class BuildDeterministicSourceDto {
  @IsEnum(["GLOBAL", "INSTITUTION", "STUDY_GROUP", "FAMILY", "USER"])
  scopeType: string;

  @IsString()
  @IsOptional()
  scopeId?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  contentIds?: string[];

  @IsEnum(["INCREMENTAL", "FULL"])
  @IsOptional()
  mode?: "INCREMENTAL" | "FULL";

  @IsBoolean()
  @IsOptional()
  dryRun?: boolean;
}

export class GetStatusDto {
  @IsEnum(["GLOBAL", "INSTITUTION", "STUDY_GROUP", "FAMILY", "USER"])
  scopeType: string;

  @IsString()
  @IsOptional()
  scopeId?: string;
}
