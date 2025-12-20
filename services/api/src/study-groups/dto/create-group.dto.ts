import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { ScopeType } from '@prisma/client';

export class CreateGroupDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsEnum(ScopeType)
  scopeType?: ScopeType;

  @IsOptional()
  @IsString()
  scopeId?: string;
}
