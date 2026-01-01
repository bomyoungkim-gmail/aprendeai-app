import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateBookmarkDto } from '../../dto/bookmarks.dto';

@Injectable()
export class CreateBookmarkUseCase {
  private readonly logger = new Logger(CreateBookmarkUseCase.name);

  constructor(private prisma: PrismaService) {}

  async execute(user_id: string, content_id: string, dto: CreateBookmarkDto) {
    this.logger.log(`Creating bookmark for user ${user_id}, content ${content_id} at page ${dto.page_number}`);
    
    return this.prisma.bookmarks.create({
      data: {
        user_id,
        content_id,
        page_number: dto.page_number,
        scroll_pct: dto.scroll_pct,
        label: dto.label,
        color: dto.color,
      },
    });
  }
}
