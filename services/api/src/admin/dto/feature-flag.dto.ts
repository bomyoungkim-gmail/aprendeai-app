import { IsOptional, IsString, IsBoolean, IsEnum, IsNotEmpty, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFeatureFlagDto {
  @ApiProperty({ description: 'Unique flag key (lowercase_underscore format)', example: 'enable_ai_translation' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^[a-z_]+$/, { message: 'Key must be lowercase with underscores only' })
  key: string;

  @ApiProperty({ description: 'Display name', example: 'AI Translation' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Feature description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Initial enabled state', default: false })
  @IsBoolean()
  enabled: boolean;

  @ApiPropertyOptional({ description: 'Target environment', enum: ['DEV', 'STAGING', 'PROD'] })
  @IsOptional()
  @IsEnum(['DEV', 'STAGING', 'PROD'])
  environment?: string;

  @ApiPropertyOptional({ description: 'Scope type', enum: ['GLOBAL', 'INSTITUTION', 'USER'] })
  @IsOptional()
  @IsEnum(['GLOBAL', 'INSTITUTION', 'USER'])
  scopeType?: string;

  @ApiPropertyOptional({ description: 'Scope target ID' })
  @IsOptional()
  @IsString()
  scopeId?: string;
}

export class UpdateFeatureFlagDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({ enum: ['DEV', 'STAGING', 'PROD'] })
  @IsOptional()
  @IsEnum(['DEV', 'STAGING', 'PROD'])
  environment?: string;

  @ApiPropertyOptional({ enum: ['GLOBAL', 'INSTITUTION', 'USER'] })
  @IsOptional()
  @IsEnum(['GLOBAL', 'INSTITUTION', 'USER'])
  scopeType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  scopeId?: string;
}

export class ToggleFeatureFlagDto {
  @ApiProperty({ description: 'New enabled state' })
  @IsBoolean()
  enabled: boolean;

  @ApiPropertyOptional({ description: 'Reason for toggle (for audit)' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class DeleteFeatureFlagDto {
  @ApiProperty({ description: 'Reason for deletion (required for audit)' })
  @IsNotEmpty()
  @IsString()
  reason: string;
}

export class FeatureFlagFilterDto {
  @ApiPropertyOptional({ description: 'Filter by environment', enum: ['DEV', 'STAGING', 'PROD'] })
  @IsOptional()
  @IsEnum(['DEV', 'STAGING', 'PROD'])
  environment?: string;

  @ApiPropertyOptional({ description: 'Filter by enabled status' })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
