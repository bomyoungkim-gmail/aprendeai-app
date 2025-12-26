
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ContentPedagogicalService {
  private readonly logger = new Logger(ContentPedagogicalService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createOrUpdatePedagogicalData(
    contentId: string,
    data: Omit<Prisma.ContentPedagogicalDataUncheckedCreateInput, 'contentId'>
  ) {
    // Upsert logic ensuring unique contentId
    return this.prisma.contentPedagogicalData.upsert({
      where: { contentId },
      create: { ...data, contentId },
      update: data,
    });
  }

  async getPedagogicalData(contentId: string) {
    return this.prisma.contentPedagogicalData.findUnique({
      where: { contentId },
    });
  }

  async recordGameResult(data: Prisma.GameResultCreateInput) {
    return this.prisma.gameResult.create({
      data,
    });
  }
}
