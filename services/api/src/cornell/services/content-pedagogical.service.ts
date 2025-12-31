import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { Prisma } from "@prisma/client";
import * as crypto from "crypto";

@Injectable()
export class ContentPedagogicalService {
  private readonly logger = new Logger(ContentPedagogicalService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createOrUpdatePedagogicalData(
    contentId: string,
    data: Omit<
      Prisma.content_pedagogical_dataUncheckedCreateInput,
      "content_id" | "id" | "updated_at" | "processed_at"
    >,
  ) {
    // Upsert logic ensuring unique contentId
    return this.prisma.content_pedagogical_data.upsert({
      where: { content_id: contentId },
      create: {
        ...data,
        id: crypto.randomUUID(),
        content_id: contentId,
        updated_at: new Date(),
      },
      update: {
        ...data,
        updated_at: new Date(),
      },
    });
  }

  async getPedagogicalData(contentId: string) {
    return this.prisma.content_pedagogical_data.findUnique({
      where: { content_id: contentId },
    });
  }

  async recordGameResult(data: Prisma.game_resultsCreateInput) {
    return this.prisma.game_results.create({
      data,
    });
  }
}
