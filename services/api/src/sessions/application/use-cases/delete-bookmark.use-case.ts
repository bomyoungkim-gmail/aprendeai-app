import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";

@Injectable()
export class DeleteBookmarkUseCase {
  constructor(private prisma: PrismaService) {}

  async execute(bookmarkId: string, user_id: string) {
    const bookmark = await this.prisma.bookmarks.findUnique({
      where: { id: bookmarkId },
    });

    if (!bookmark) {
      throw new NotFoundException("Bookmark not found");
    }

    if (bookmark.user_id !== user_id) {
      throw new ForbiddenException("Not allowed to delete this bookmark");
    }

    return this.prisma.bookmarks.delete({
      where: { id: bookmarkId },
    });
  }
}
