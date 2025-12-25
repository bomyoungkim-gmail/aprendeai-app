import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { SearchService } from "./search.service";
import { SearchDto } from "./dto/search.dto";

@Controller("search")
@UseGuards(JwtAuthGuard)
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  /**
   * Global search endpoint
   */
  @Get()
  async search(@CurrentUser("sub") userId: string, @Query() dto: SearchDto) {
    return this.searchService.search(userId, dto);
  }
}
