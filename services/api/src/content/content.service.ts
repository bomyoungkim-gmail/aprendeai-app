import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContentDto, UpdateContentDto } from './dto/content.dto';
import { CreateContentVersionDto } from './dto/content-version.dto';

@Injectable()
export class ContentService {
  constructor(private prisma: PrismaService) {}

  create(createContentDto: CreateContentDto) {
    return this.prisma.content.create({
      data: createContentDto,
    });
  }

  findAll() {
    return this.prisma.content.findMany();
  }

  findOne(id: string) {
    return this.prisma.content.findUnique({
      where: { id },
      include: { versions: true },
    });
  }

  update(id: string, updateContentDto: UpdateContentDto) {
    return this.prisma.content.update({
      where: { id },
      data: updateContentDto,
    });
  }

  remove(id: string) {
    return this.prisma.content.delete({
      where: { id },
    });
  }

  addVersion(contentId: string, dto: CreateContentVersionDto) {
    return this.prisma.contentVersion.create({
      data: {
        contentId,
        ...dto,
      },
    });
  }
}
