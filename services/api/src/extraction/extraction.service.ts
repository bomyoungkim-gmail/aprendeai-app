import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QueueService } from '../queue/queue.service';
import { EntitlementsService } from '../billing/entitlements.service';
import { UsageTrackingService } from '../billing/usage-tracking.service';

@Injectable()
export class ExtractionService {
  constructor(
    private prisma: PrismaService,
    private queue: QueueService,
    private entitlements: EntitlementsService,
    private usageTracking: UsageTrackingService,
  ) {}

  async requestExtraction(contentId: string, userId: string) {
    // 1. Check if content exists and user has access
    const content = await this.prisma.content.findUnique({
      where: { id: contentId },
    });

    if (!content) {
      throw new NotFoundException('Content not found');
    }

    // Simple ownership check (can be expanded later)
    if (content.ownerUserId !== userId && content.createdBy !== userId) {
      throw new ForbiddenException('No access to this content');
    }

    // 2. Check entitlements (AI extraction feature)
    const hasAccess = await this.entitlements.hasEntitlement(
      userId,
      'ai_extract_enabled'
    );

    if (!hasAccess) {
      throw new ForbiddenException('AI extraction not available in your plan');
    }

    // 3. Get or create extraction record
    let extraction = await this.prisma.contentExtraction.findUnique({
      where: { contentId },
    });

    if (!extraction) {
      extraction = await this.prisma.contentExtraction.create({
        data: {
          contentId,
          status: 'PENDING',
        },
      });
    } else if (extraction.status === 'DONE') {
      // Already extracted, return existing
      return extraction;
    } else if (extraction.status === 'RUNNING') {
      // Already in progress
      return extraction;
    }

    // 4. Update status to PENDING (if was FAILED before)
    if (extraction.status === 'FAILED') {
      extraction = await this.prisma.contentExtraction.update({
        where: { id: extraction.id },
        data: { status: 'PENDING', updatedAt: new Date() },
      });
    }

    // 5. Track usage (pages extracted will be tracked by worker)
    await this.usageTracking.trackUsage({
      scopeType: 'USER',
      scopeId: userId,
      metric: 'extraction_requested',
      quantity: 1,
      environment: process.env.NODE_ENV as any,
    });

    // 6. Publish job to RabbitMQ
    await this.queue.publishExtractionJob(contentId);

    return extraction;
  }

  async getExtractionStatus(contentId: string) {
    const extraction = await this.prisma.contentExtraction.findUnique({
      where: { contentId },
      include: {
        content: {
          select: {
            title: true,
            contentType: true,
          },
        },
      },
    });

    if (!extraction) {
      throw new NotFoundException('Extraction not found');
    }

    return extraction;
  }

  async getChunks(
    contentId: string,
    page?: number,
    range?: string,
  ) {
    const where: any = { contentId };

    if (page !== undefined) {
      where.pageNumber = page;
    }

    if (range) {
      const [start, end] = range.split('-').map(Number);
      where.chunkIndex = {
        gte: start,
        lte: end,
      };
    }

    const chunks = await this.prisma.contentChunk.findMany({
      where,
      orderBy: { chunkIndex: 'asc' },
      take: 50, // Max 50 chunks per request
    });

    return chunks;
  }
}
