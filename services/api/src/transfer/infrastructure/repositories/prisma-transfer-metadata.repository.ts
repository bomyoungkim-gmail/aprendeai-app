import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import {
  ITransferMetadataRepository,
  TransferMetadataEntity,
} from "../../domain/transfer-metadata.repository.interface";

@Injectable()
export class PrismaTransferMetadataRepository implements ITransferMetadataRepository {
  constructor(private readonly prisma: PrismaService) {}

  async upsert(
    metadata: TransferMetadataEntity,
  ): Promise<TransferMetadataEntity> {
    const createData = {
      id: metadata.id,
      content_id: metadata.contentId,
      chunk_id: metadata.chunkId || null,
      chunk_index: metadata.chunkIndex || null,
      page_number: metadata.pageNumber || null,
      anchor_json: metadata.anchorJson || null,
      version: metadata.version,
      concept_json: metadata.conceptJson,
      tier2_json: metadata.tier2Json,
      analogies_json: metadata.analogiesJson,
      domains_json: metadata.domainsJson,
      tools_json: metadata.toolsJson,
      created_by: metadata.createdBy || null,
      scope_type: metadata.scopeType as any,
      family_id: metadata.familyId || null,
      institution_id: metadata.institutionId || null,
    };

    const updateData = {
      concept_json: metadata.conceptJson,
      tier2_json: metadata.tier2Json,
      analogies_json: metadata.analogiesJson,
      domains_json: metadata.domainsJson,
      tools_json: metadata.toolsJson,
      updated_at: new Date(),
    };

    const result = await this.prisma.section_transfer_metadata.upsert({
      where: {
        id: metadata.id,
      },
      create: createData,
      update: updateData,
    });

    return this.toDomain(result);
  }

  async findByContentAndChunk(params: {
    contentId: string;
    chunkId?: string;
    chunkIndex?: number;
    pageNumber?: number;
    scopeType: string;
  }): Promise<TransferMetadataEntity | null> {
    const where: any = {
      content_id: params.contentId,
      scope_type: params.scopeType as any,
    };

    if (params.chunkId) {
      where.chunk_id = params.chunkId;
    } else if (params.chunkIndex !== undefined) {
      where.chunk_index = params.chunkIndex;
    } else if (params.pageNumber !== undefined) {
      where.page_number = params.pageNumber;
    }

    const result = await this.prisma.section_transfer_metadata.findFirst({
      where,
      orderBy: { created_at: "desc" },
    });

    return result ? this.toDomain(result) : null;
  }

  async findManyByContent(
    contentId: string,
    scopeType: string,
  ): Promise<TransferMetadataEntity[]> {
    const results = await this.prisma.section_transfer_metadata.findMany({
      where: {
        content_id: contentId,
        scope_type: scopeType as any,
      },
      orderBy: [{ chunk_index: "asc" }, { page_number: "asc" }],
    });

    return results.map((r) => this.toDomain(r));
  }

  private toDomain(prismaEntity: any): TransferMetadataEntity {
    return {
      id: prismaEntity.id,
      contentId: prismaEntity.content_id,
      chunkId: prismaEntity.chunk_id,
      chunkIndex: prismaEntity.chunk_index,
      pageNumber: prismaEntity.page_number,
      anchorJson: prismaEntity.anchor_json,
      version: prismaEntity.version,
      conceptJson: prismaEntity.concept_json,
      tier2Json: prismaEntity.tier2_json,
      analogiesJson: prismaEntity.analogies_json,
      domainsJson: prismaEntity.domains_json,
      toolsJson: prismaEntity.tools_json,
      createdBy: prismaEntity.created_by,
      scopeType: prismaEntity.scope_type,
      familyId: prismaEntity.family_id,
      institutionId: prismaEntity.institution_id,
      createdAt: prismaEntity.created_at,
      updatedAt: prismaEntity.updated_at,
    };
  }
}
