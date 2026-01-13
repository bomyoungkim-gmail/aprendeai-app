import { IsString, IsNotEmpty, IsOptional, IsEnum } from "class-validator";

export enum GraphScopeTypeEnum {
  USER = "USER",
  FAMILY = "FAMILY",
  INSTITUTION = "INSTITUTION",
  STUDY_GROUP = "STUDY_GROUP",
  GLOBAL = "GLOBAL",
}

export class BuildBaselineDto {
  @IsString()
  @IsNotEmpty()
  contentId: string;

  @IsEnum(GraphScopeTypeEnum)
  @IsOptional()
  scopeType?: GraphScopeTypeEnum = GraphScopeTypeEnum.GLOBAL;

  @IsString()
  @IsOptional()
  scopeId?: string;

  @IsOptional()
  useLlm?: boolean = false; // Policy controlled
}
