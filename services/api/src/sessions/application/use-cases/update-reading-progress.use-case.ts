import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { UpdateReadingProgressDto } from '../../dto/reading-progress.dto';

@Injectable()
export class UpdateReadingProgressUseCase {
  private readonly logger = new Logger(UpdateReadingProgressUseCase.name);

  constructor(private prisma: PrismaService) {}

  async execute(user_id: string, content_id: string, dto: UpdateReadingProgressDto) {
    this.logger.log(`Updating reading progress for user ${user_id}, content ${content_id}`);

    return this.prisma.reading_progress.upsert({
      where: {
        user_id_content_id: {
          user_id,
          content_id,
        },
      },
      update: {
        last_page: dto.last_page,
        last_scroll_pct: dto.last_scroll_pct,
        device_info: dto.device_info,
      },
      create: {
        user_id,
        content_id,
        last_page: dto.last_page,
        last_scroll_pct: dto.last_scroll_pct,
        device_info: dto.device_info,
      },
    });
  }
}
