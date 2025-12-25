import {
  Injectable,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { EntitlementsService } from "../billing/entitlements.service";
import { QueueService } from "../queue/queue.service";
import { GenerateAssetDto } from "./dto/assets.dto";
import { randomUUID } from "crypto";
import * as crypto from "crypto";

@Injectable()
export class AssetsService {
  constructor(
    private prisma: PrismaService,
    private entitlements: EntitlementsService,
    private queue: QueueService,
  ) {}

  async generateAsset(
    userId: string,
    contentId: string,
    dto: GenerateAssetDto,
  ) {
    // 1. Check entitlements
    const ent = await this.entitlements.resolve("USER", userId);

    // Cast features to any or explicit type if available
    const features = ent.features as any;
    if (!features.ai_cornell_assist_enabled) {
      throw new ForbiddenException(
        "AI Cornell Assist is not enabled for this user",
      );
    }

    // 2. Check usage limits (placeholder - implement actual tracking)
    // await this.checkUsageLimits(userId, ent.limits);

    // 3. Verify chunks exist
    const chunksCount = await this.prisma.contentChunk.count({
      where: { contentId },
    });

    if (chunksCount === 0) {
      throw new BadRequestException(
        "Content must be extracted first. Please run extraction before generating assets.",
      );
    }

    // 4. Calculate cache hash
    const cacheHash = this.calculateCacheHash(contentId, dto);

    // 5. Check cache - return existing asset if available
    const cached = await this.prisma.learningAsset.findFirst({
      where: {
        contentId,
        layer: dto.layer,
        modality: dto.modality,
        promptVersion: dto.promptVersion || "v1.0",
      },
      orderBy: { createdAt: "desc" },
    });

    if (cached) {
      return {
        jobId: null,
        status: "completed" as const,
        asset: cached,
      };
    }

    // 6. Publish job to queue
    const jobId = randomUUID();
    await this.queue.publish("assets.generate", {
      jobId,
      userId,
      contentId,
      layer: dto.layer,
      educationLevel: dto.educationLevel,
      modality: dto.modality,
      selectedHighlightIds: dto.selectedHighlightIds,
      promptVersion: dto.promptVersion || "v1.0",
      timestamp: new Date().toISOString(),
    });

    return {
      jobId,
      status: "queued" as const,
      estimatedTime: 60, // seconds
    };
  }

  async getAssets(contentId: string, filters: any) {
    return this.prisma.learningAsset.findMany({
      where: {
        contentId,
        ...(filters.layer && { layer: filters.layer }),
        ...(filters.promptVersion && { promptVersion: filters.promptVersion }),
      },
      orderBy: { createdAt: "desc" },
    });
  }

  private calculateCacheHash(contentId: string, dto: GenerateAssetDto): string {
    const highlightsHash = dto.selectedHighlightIds
      ? crypto
          .createHash("sha256")
          .update(dto.selectedHighlightIds.sort().join(","))
          .digest("hex")
      : "none";

    const data = `${contentId}-${dto.layer}-${dto.educationLevel}-${dto.modality}-${dto.promptVersion || "v1.0"}-${highlightsHash}`;
    return crypto.createHash("sha256").update(data).digest("hex");
  }

  // TODO: Implement actual usage tracking
  private async checkUsageLimits(userId: string, limits: any) {
    // Check ai_chars_per_day, assets_generate_per_day
    // Query usage_events and verify limits not exceeded
  }
}
