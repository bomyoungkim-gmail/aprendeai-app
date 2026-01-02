import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";

@Injectable()
export class GetReadingProgressUseCase {
  constructor(private prisma: PrismaService) {}

  async execute(user_id: string, content_id: string) {
    const progress = await this.prisma.reading_progress.findUnique({
      where: {
        user_id_content_id: {
          user_id,
          content_id,
        },
      },
    });

    if (!progress) {
      return {
        last_page: 0,
        last_scroll_pct: 0,
        updated_at: null,
      };
    }

    return progress;
  }
}
