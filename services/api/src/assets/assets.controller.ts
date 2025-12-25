import { Controller, Post, Get, Param, Body, Query, Req } from "@nestjs/common";
import { AssetsService } from "./assets.service";
import { GenerateAssetDto, ListAssetsQueryDto } from "./dto/assets.dto";

@Controller("contents/:contentId/assets")
export class AssetsController {
  constructor(private assetsService: AssetsService) {}

  @Post("generate")
  async generate(
    @Param("contentId") contentId: string,
    @Body() dto: GenerateAssetDto,
    @Req() req: any,
  ) {
    // TODO: Replace with actual user from AuthGuard
    const userId = req.user?.id || "test-user-id";

    return this.assetsService.generateAsset(userId, contentId, dto);
  }

  @Get()
  async list(
    @Param("contentId") contentId: string,
    @Query() filters: ListAssetsQueryDto,
  ) {
    return this.assetsService.getAssets(contentId, filters);
  }
}
