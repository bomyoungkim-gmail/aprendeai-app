import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class GetBookmarksUseCase {
  constructor(private prisma: PrismaService) {}

  async execute(user_id: string, content_id: string) {
    return this.prisma.bookmarks.findMany({
      where: {
        user_id,
        content_id,
      },
      orderBy: {
        created_at: 'desc',
      },
    });
  }
}
