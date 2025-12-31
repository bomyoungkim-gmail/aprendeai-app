import {
  IsOptional,
  IsString,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsNotEmpty,
  IsArray,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { SystemRole, ContextRole } from "@prisma/client";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class UserSearchDto {
  @ApiPropertyOptional({ description: "Search by email or name" })
  @IsOptional()
  @IsString()
  query?: string;

  @ApiPropertyOptional({
    description: "Filter by status",
    enum: ["ACTIVE", "SUSPENDED", "DELETED"],
  })
  @IsOptional()
  @IsEnum(["ACTIVE", "SUSPENDED", "DELETED"])
  status?: string;

  @ApiPropertyOptional({
    description: "Filter by system role",
    enum: SystemRole,
  })
  @IsOptional()
  @IsEnum(SystemRole)
  systemRole?: string;

  @ApiPropertyOptional({
    description: "Filter by context role",
    enum: ContextRole,
  })
  @IsOptional()
  @IsEnum(ContextRole)
  contextRole?: string;

  @ApiPropertyOptional({ description: "Filter by institution ID" })
  @IsOptional()
  @IsString()
  institutionId?: string;

  @ApiPropertyOptional({ description: "Page number", default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: "Results per page",
    default: 25,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 25;
}

export class UpdateUserStatusDto {
  @ApiProperty({
    description: "New status",
    enum: ["ACTIVE", "SUSPENDED", "DELETED"],
  })
  @IsNotEmpty()
  @IsEnum(["ACTIVE", "SUSPENDED", "DELETED"])
  status: string;

  @ApiProperty({ description: "Reason for status change (required for audit)" })
  @IsNotEmpty()
  @IsString()
  reason: string;
}

export class RoleAssignmentDto {
  @ApiProperty({ enum: { ...SystemRole, ...ContextRole } })
  @IsEnum({ ...SystemRole, ...ContextRole })
  role: string;

  @ApiPropertyOptional({ enum: ["GLOBAL", "INSTITUTION", "USER"] })
  @IsOptional()
  @IsEnum(["GLOBAL", "INSTITUTION", "USER"])
  scopeType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  scopeId?: string;
}

export class UpdateUserRolesDto {
  @ApiProperty({
    type: [RoleAssignmentDto],
    description: "New role assignments",
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RoleAssignmentDto)
  roles: RoleAssignmentDto[];

  @ApiProperty({ description: "Reason for role changes (required for audit)" })
  @IsNotEmpty()
  @IsString()
  reason: string;
}

export class ImpersonateUserDto {
  @ApiProperty({ description: "Reason for impersonation (required for audit)" })
  @IsNotEmpty()
  @IsString()
  reason: string;

  @ApiPropertyOptional({
    description: "Duration in minutes",
    default: 15,
    minimum: 5,
    maximum: 60,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(5)
  @Max(60)
  durationMinutes?: number = 15;
}
