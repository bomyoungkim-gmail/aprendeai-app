import { TransferMissionType, ScopeType } from '@prisma/client';

export interface TransferMissionEntity {
  id: string;
  type: TransferMissionType;
  title: string;
  description: string | null;
  promptTemplate: string;
  rubricJson: any;
  difficulty: number;
  tagsJson: any;
  scopeType: ScopeType;
  familyId: string | null;
  institutionId: string | null;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface FindMissionsParams {
  scopeType?: ScopeType;
  familyId?: string;
  institutionId?: string;
  isActive?: boolean;
}

export abstract class ITransferMissionRepository {
  abstract findAll(params: FindMissionsParams): Promise<TransferMissionEntity[]>;
  abstract findById(id: string): Promise<TransferMissionEntity | null>;
  abstract create(mission: Omit<TransferMissionEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<TransferMissionEntity>;
  abstract update(id: string, data: Partial<TransferMissionEntity>): Promise<TransferMissionEntity>;
}
