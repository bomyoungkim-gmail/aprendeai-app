import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { IHighlightsRepository } from "../../domain/interfaces/highlights.repository.interface";
import { Highlight } from "../../domain/entities/highlight.entity";
import { HighlightKind, TargetType } from "@prisma/client";

@Injectable()
export class PrismaHighlightsRepository implements IHighlightsRepository {
  constructor(private prisma: PrismaService) {}

  async findAllByContent(
    contentId: string,
    userId: string,
  ): Promise<Highlight[]> {
    const found = await this.prisma.highlights.findMany({
      where: { content_id: contentId, user_id: userId },
      orderBy: { created_at: "asc" },
    });
    return found.map((h) => this.mapToDomain(h));
  }

  async findById(id: string): Promise<Highlight | null> {
    const found = await this.prisma.highlights.findUnique({
      where: { id },
    });
    return found ? this.mapToDomain(found) : null;
  }

  async create(highlight: Highlight): Promise<Highlight> {
    const created = await this.prisma.highlights.create({
      data: {
        id: highlight.id,
        content_id: highlight.contentId,
        user_id: highlight.userId,
        kind: highlight.kind as HighlightKind,
        target_type: highlight.targetType as TargetType,
        page_number: highlight.pageNumber,
        anchor_json: highlight.anchor,
        color_key: highlight.colorKey,
        comment_text: highlight.commentText,
        tags_json: highlight.tags || [],
        timestamp_ms: highlight.timestampMs,
        duration_ms: highlight.durationMs,
        visibility: highlight.visibility as any, // Enum
        visibility_scope: highlight.visibilityScope as any, // Enum
        context_type: highlight.contextType as any, // Enum
        context_id: highlight.contextId,
        learner_id: highlight.learnerId,
        status: highlight.status as any || "ACTIVE",
      },
    });
    return this.mapToDomain(created);
  }

  async update(highlight: Highlight): Promise<Highlight> {
    const updated = await this.prisma.highlights.update({
      where: { id: highlight.id },
      data: {
        color_key: highlight.colorKey,
        comment_text: highlight.commentText,
        tags_json: highlight.tags,
        visibility: highlight.visibility as any,
        visibility_scope: highlight.visibilityScope as any,
        context_type: highlight.contextType as any,
        context_id: highlight.contextId,
        learner_id: highlight.learnerId,
        status: highlight.status as any,
        updated_at: new Date(),
      },
    });
    return this.mapToDomain(updated);
  }

  async delete(id: string): Promise<void> {
    // Soft delete usually, or hard delete? The service used soft delete.
    // The previous implementation used delete().
    // I will adhere to hard delete for now OR check if status param can handle soft delete.
    // The 'delete' method in repo usually means hard delete.
    // I should add 'softDelete' to interface if needed or just update status.
    // For now, I'll keep hard delete to match the interface contract, but check usage.
    await this.prisma.highlights.delete({ where: { id } });
  }

  private mapToDomain(prismaHighlight: any): Highlight {
    return new Highlight({
      id: prismaHighlight.id,
      contentId: prismaHighlight.content_id,
      userId: prismaHighlight.user_id,
      kind: prismaHighlight.kind,
      targetType: prismaHighlight.target_type,
      pageNumber: prismaHighlight.page_number,
      anchor: prismaHighlight.anchor_json,
      colorKey: prismaHighlight.color_key,
      commentText: prismaHighlight.comment_text,
      tags: prismaHighlight.tags_json as string[],
      timestampMs: prismaHighlight.timestamp_ms,
      durationMs: prismaHighlight.duration_ms,
      visibility: prismaHighlight.visibility,
      visibilityScope: prismaHighlight.visibility_scope,
      contextType: prismaHighlight.context_type,
      contextId: prismaHighlight.context_id,
      learnerId: prismaHighlight.learner_id,
      status: prismaHighlight.status,
      createdAt: prismaHighlight.created_at,
      updatedAt: prismaHighlight.updated_at,
    });
  }
}
