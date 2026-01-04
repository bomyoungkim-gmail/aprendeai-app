import { IsEnum, IsOptional, IsString, IsBoolean } from 'class-validator';
import { ScopeType } from '@prisma/client';

export class ListMissionsQueryDto {
  @IsOptional()
  @IsEnum(ScopeType)
  scopeType?: ScopeType;

  @IsOptional()
  @IsString()
  familyId?: string;

  @IsOptional()
  @IsString()
  institutionId?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class TransferMissionDto {
  id: string;
  type: string;
  title: string;
  description: string | null;
  promptTemplate: string;
  rubricJson: any;
  difficulty: number;
  tagsJson: any;
  scopeType: string;
  familyId: string | null;
  institutionId: string | null;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}
