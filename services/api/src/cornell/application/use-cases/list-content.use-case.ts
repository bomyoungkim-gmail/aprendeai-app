import { Injectable, Inject } from "@nestjs/common";
import { ContentAccessService } from "../../services/content-access.service";
import { IContentRepository } from "../../domain/content.repository.interface";
import { Content } from "../../domain/content.entity";
import { ContentType, Language } from "@prisma/client";

export interface ListContentFilters {
  type?: ContentType;
  language?: Language;
  page?: number;
  limit?: number;
  query?: string;
}

@Injectable()
export class ListContentUseCase {
  constructor(
    @Inject(IContentRepository)
    private readonly contentRepository: IContentRepository,
    private readonly contentAccessService: ContentAccessService,
  ) {}

  async execute(
    userId: string,
    filters: ListContentFilters,
  ): Promise<{ results: Content[]; total: number }> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      OR: this.contentAccessService.getOwnerFilter(userId),
    };

    if (filters.type) where.type = filters.type;
    if (filters.language) where.original_language = filters.language;
    if (filters.query) {
      where.OR = [
        { title: { contains: filters.query, mode: "insensitive" } },
        { raw_text: { contains: filters.query, mode: "insensitive" } },
      ];
    }

    const [results, total] = await Promise.all([
      this.contentRepository.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: "desc" },
      }),
      this.contentRepository.count({ where }),
    ]);

    return { results, total };
  }
}
