import { IsString, IsOptional, IsNumber, IsBoolean, IsEnum, IsObject, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ScopeType, SubscriptionStatus } from '@prisma/client';

// ========== Plans ==========

export class CreatePlanDto {
  @ApiProperty()
  @IsString()
  code: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty()
  @IsObject()
  entitlements: any;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  monthlyPrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  yearlyPrice?: number;
}

export class UpdatePlanDto {
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
  @IsObject()
  entitlements?: any;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  monthlyPrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  yearlyPrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// ========== Subscriptions ==========

export class AssignPlanDto {
  @ApiProperty({ enum: ScopeType })
  @IsEnum(ScopeType)
  scopeType: ScopeType;

  @ApiProperty()
  @IsString()
  scopeId: string;

  @ApiProperty()
  @IsString()
  planCode: string;

  @ApiProperty()
  @IsString()
  reason: string;
}

export class CancelSubscriptionDto {
  @ApiProperty()
  @IsString()
  subscriptionId: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  cancelAtPeriodEnd?: boolean;

  @ApiProperty()
  @IsString()
  reason: string;
}

export class SubscriptionFilterDto {
  @ApiPropertyOptional({ enum: ScopeType })
  @IsOptional()
  @IsEnum(ScopeType)
  scopeType?: ScopeType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  scopeId?: string;

  @ApiPropertyOptional({ enum: SubscriptionStatus })
  @IsOptional()
  @IsEnum(SubscriptionStatus)
  status?: SubscriptionStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  planId?: string;
}

// ========== Entitlements ==========



export class PreviewEntitlementsDto {
  @ApiProperty({ enum: ScopeType })
  @IsEnum(ScopeType)
  scopeType: ScopeType;

  @ApiProperty()
  @IsString()
  scopeId: string;
}

export class SetOverridesDto {
  @ApiProperty({ enum: ScopeType })
  @IsEnum(ScopeType)
  scopeType: ScopeType;

  @ApiProperty()
  @IsString()
  scopeId: string;

  @ApiProperty()
  @IsObject()
  overrides: any;

  @ApiProperty()
  @IsString()
  reason: string;
}

// ========== Usage ==========

export class UsageRangeDto {
  @ApiPropertyOptional({ enum: ['today', '7d', '30d'], default: 'today' })
  @IsOptional()
  @IsEnum(['today', '7d', '30d'])
  range?: 'today' | '7d' | '30d';
}
