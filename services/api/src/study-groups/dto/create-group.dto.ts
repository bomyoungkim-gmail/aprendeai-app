import { IsString, IsNotEmpty, IsOptional, IsEnum } from "class-validator";
import { ScopeType } from "@prisma/client";

export class CreateGroupDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsEnum(ScopeType)
  scope_type?: ScopeType;

  @IsOptional()
  @IsString()
  scope_id?: string;
}
