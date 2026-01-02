import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { IContentRepository } from "../../domain/content.repository.interface";
import { Content, ContentVersion } from "../../domain/content.entity";

@Injectable()
export class PrismaContentRepository implements IContentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Partial<Content>): Promise<Content> {
    const created = await this.prisma.contents.create({
      data: {
        id: data.id,
        title: data.title!,
        type: data.type!,
        original_language: data.originalLanguage!,
        raw_text: data.rawText,
        owner_type: data.ownerType!,
        owner_id: data.ownerId!,
        owner_user_id: data.ownerType === "USER" ? data.ownerId : undefined,
        institution_id: data.scopeType === "INSTITUTION" ? data.scopeId : undefined,
        scope_type: data.scopeType!,
        scope_id: data.scopeId,
        metadata: data.metadata || {},
        updated_at: new Date(),
        // Map source_url from metadata if present (hack for now until entity update, or handled by caller via metadata)
        source_url: data.metadata?.source_url
      },
    });
    return this.mapToDomain(created);
  }

  async findById(id: string): Promise<Content | null> {
    const found = await this.prisma.contents.findUnique({ 
        where: { id },
        include: { files: true } 
    });
    return found ? this.mapToDomain(found) : null;
  }

  async update(id: string, data: Partial<Content>): Promise<Content> {
    const updated = await this.prisma.contents.update({
      where: { id },
      data: {
        title: data.title,
        metadata: data.metadata,
        // Add other fields as needed
      },
    });
    return this.mapToDomain(updated);
  }

  async findMany(params: { where?: any; skip?: number; take?: number; orderBy?: any }): Promise<Content[]> {
    const found = await this.prisma.contents.findMany({
      where: params.where,
      skip: params.skip,
      take: params.take,
      orderBy: params.orderBy,
    });
    return found.map(this.mapToDomain);
  }

  async count(params: { where?: any }): Promise<number> {
    return this.prisma.contents.count({ where: params.where });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.contents.delete({ where: { id } });
  }

  async addVersion(version: ContentVersion): Promise<ContentVersion> {
      const created = await this.prisma.content_versions.create({
          data: {
              id: version.id,
              content_id: version.contentId,
              target_language: version.targetLanguage,
              schooling_level_target: version.schoolingLevelTarget as any, // Enum mapping check needed if strictly typed
              simplified_text: version.simplifiedText,
              summary: version.summary
          }
      });
      return new ContentVersion({
          id: created.id,
          contentId: created.content_id,
          targetLanguage: created.target_language,
          schoolingLevelTarget: created.schooling_level_target,
          simplifiedText: created.simplified_text,
          summary: created.summary,
          createdAt: created.created_at
      });
  }

  private mapToDomain(prismaContent: any): Content {
    return new Content({
      id: prismaContent.id,
      title: prismaContent.title,
      type: prismaContent.type,
      originalLanguage: prismaContent.original_language,
      rawText: prismaContent.raw_text,
      ownerType: prismaContent.owner_type,
      ownerId: prismaContent.owner_id,
      scopeType: prismaContent.scope_type,
      scopeId: prismaContent.scope_id,
      metadata: prismaContent.metadata,
      file: prismaContent.files ? {
          id: prismaContent.files.id,
          originalFilename: prismaContent.files.originalFilename,
          mimeType: prismaContent.files.mimeType,
          sizeBytes: Number(prismaContent.files.sizeBytes),
      } : undefined,
      createdAt: prismaContent.created_at,
      updatedAt: prismaContent.updated_at,
    });
  }
}
