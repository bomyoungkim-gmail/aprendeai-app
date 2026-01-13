import { IsBoolean, IsOptional, IsString, IsArray } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class BuildDeterministicSourceDto {
  @ApiProperty({
    enum: ["GLOBAL", "INSTITUTION", "STUDY_GROUP", "FAMILY", "USER"],
  })
  scopeType: "GLOBAL" | "INSTITUTION" | "STUDY_GROUP" | "FAMILY" | "USER";

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  scopeId?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  contentIds?: string[];

  @ApiPropertyOptional({ enum: ["INCREMENTAL", "FULL"] })
  @IsString()
  @IsOptional()
  mode?: "INCREMENTAL" | "FULL";

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  dryRun?: boolean;
}

export class GetStatusDto {
  @ApiProperty()
  @IsString()
  runId: string;
}
