import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import {
  ITransferMissionRepository,
  FindMissionsParams,
  TransferMissionEntity,
} from "../../domain/transfer-mission.repository.interface";

@Injectable()
export class PrismaTransferMissionRepository implements ITransferMissionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: FindMissionsParams): Promise<TransferMissionEntity[]> {
    const { scopeType, familyId, institutionId, isActive } = params;

    const results = await this.prisma.transfer_missions.findMany({
      where: {
        scope_type: scopeType,
        family_id: familyId,
        institution_id: institutionId,
        is_active: isActive,
      },
    });

    return results.map(this.toEntity);
  }

  async findById(id: string): Promise<TransferMissionEntity | null> {
    const result = await this.prisma.transfer_missions.findUnique({
      where: { id },
    });
    return result ? this.toEntity(result) : null;
  }

  async create(
    mission: Omit<TransferMissionEntity, "id" | "createdAt" | "updatedAt">,
  ): Promise<TransferMissionEntity> {
    const {
      type,
      title,
      description,
      promptTemplate,
      rubricJson,
      difficulty,
      tagsJson,
      scopeType,
      familyId,
      institutionId,
      createdBy,
      isActive,
    } = mission;

    const result = await this.prisma.transfer_missions.create({
      data: {
        type,
        title,
        description,
        prompt_template: promptTemplate,
        rubric_json: rubricJson,
        difficulty,
        tags_json: tagsJson,
        scope_type: scopeType,
        family_id: familyId,
        institution_id: institutionId,
        created_by: createdBy,
        is_active: isActive,
      },
    });

    return this.toEntity(result);
  }

  async update(
    id: string,
    data: Partial<TransferMissionEntity>,
  ): Promise<TransferMissionEntity> {
    const result = await this.prisma.transfer_missions.update({
      where: { id },
      data: {
        type: data.type,
        title: data.title,
        description: data.description,
        prompt_template: data.promptTemplate,
        rubric_json: data.rubricJson,
        difficulty: data.difficulty,
        tags_json: data.tagsJson,
        scope_type: data.scopeType,
        family_id: data.familyId,
        institution_id: data.institutionId,
        is_active: data.isActive,
      },
    });

    return this.toEntity(result);
  }

  private toEntity(prismaMission: any): TransferMissionEntity {
    return {
      id: prismaMission.id,
      type: prismaMission.type,
      title: prismaMission.title,
      description: prismaMission.description,
      promptTemplate: prismaMission.prompt_template,
      rubricJson: prismaMission.rubric_json,
      difficulty: prismaMission.difficulty,
      tagsJson: prismaMission.tags_json,
      scopeType: prismaMission.scope_type,
      familyId: prismaMission.family_id,
      institutionId: prismaMission.institution_id,
      createdBy: prismaMission.created_by,
      createdAt: prismaMission.created_at,
      updatedAt: prismaMission.updated_at,
      isActive: prismaMission.is_active,
    };
  }
}
