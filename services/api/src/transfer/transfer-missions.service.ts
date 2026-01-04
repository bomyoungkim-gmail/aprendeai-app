import { Injectable, Inject } from '@nestjs/common';
import {
  ITransferMissionRepository,
  FindMissionsParams,
  TransferMissionEntity,
} from './domain/transfer-mission.repository.interface';

@Injectable()
export class TransferMissionsService {
  constructor(
    @Inject(ITransferMissionRepository)
    private readonly repository: ITransferMissionRepository,
  ) {}

  async listMissions(params: FindMissionsParams): Promise<TransferMissionEntity[]> {
    return await this.repository.findAll(params);
  }

  async getMissionById(id: string): Promise<TransferMissionEntity | null> {
    return await this.repository.findById(id);
  }
}
