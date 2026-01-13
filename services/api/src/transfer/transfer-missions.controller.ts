import { Controller, Get, Query } from "@nestjs/common";
import { TransferMissionsService } from "./transfer-missions.service";
import {
  ListMissionsQueryDto,
  TransferMissionDto,
} from "./application/dto/transfer-mission.dto";

@Controller("transfer/missions")
export class TransferMissionsController {
  constructor(private readonly service: TransferMissionsService) {}

  @Get()
  async listMissions(
    @Query() query: ListMissionsQueryDto,
  ): Promise<TransferMissionDto[]> {
    const missions = await this.service.listMissions({
      scopeType: query.scopeType,
      familyId: query.familyId,
      institutionId: query.institutionId,
      isActive: query.isActive ?? true,
    });

    return missions.map(this.toDto);
  }

  // Mapper: Domain Entity -> DTO (camelCase -> camelCase, but explicit)
  private toDto(entity: any): TransferMissionDto {
    return {
      id: entity.id,
      type: entity.type,
      title: entity.title,
      description: entity.description,
      promptTemplate: entity.promptTemplate,
      rubricJson: entity.rubricJson,
      difficulty: entity.difficulty,
      tagsJson: entity.tagsJson,
      scopeType: entity.scopeType,
      familyId: entity.familyId,
      institutionId: entity.institutionId,
      createdBy: entity.createdBy,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      isActive: entity.isActive,
    };
  }
}
