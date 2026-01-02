import { Module } from "@nestjs/common";
import { SearchService } from "./search.service";
import { SearchController } from "./search.controller";
import { PrismaModule } from "../prisma/prisma.module";
import { PrismaSearchRepository } from "./infrastructure/repositories/prisma-search.repository";
import { SearchUseCase } from "./application/use-cases/search.use-case";
import { ISearchRepository } from "./domain/interfaces/search.repository.interface";

import { ContentAccessModule } from "../cornell/content-access.module";

@Module({
  imports: [PrismaModule, ContentAccessModule],
  controllers: [SearchController],
  providers: [
    SearchService,
    SearchUseCase,
    { provide: ISearchRepository, useClass: PrismaSearchRepository },
  ],
  exports: [SearchService, ISearchRepository],
})
export class SearchModule {}
