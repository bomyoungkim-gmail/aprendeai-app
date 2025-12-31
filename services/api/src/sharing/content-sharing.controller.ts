import {
  Controller,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/infrastructure/jwt-auth.guard";
import { SharingService } from "./sharing.service";
import { ShareContentRequest, ShareContextType } from "./dto/sharing.dto";

@ApiTags("Sharing")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("contents/:contentId/shares")
export class ContentSharingController {
  constructor(private readonly sharingService: SharingService) {}

  @Post()
  @ApiOperation({
    summary: "Share content with a context (Classroom, Family, Group)",
  })
  async share(
    @Param("contentId") contentId: string,
    @Body() dto: ShareContentRequest,
    @Request() req,
  ) {
    return this.sharingService.shareContent(req.user.id, contentId, dto);
  }

  @Delete()
  @ApiOperation({ summary: "Revoke share" })
  async revoke(
    @Param("contentId") contentId: string,
    @Query("contextType") contextType: ShareContextType,
    @Query("contextId") contextId: string,
    @Request() req,
  ) {
    return this.sharingService.revokeContentShare(
      req.user.id,
      contentId,
      contextType,
      contextId,
    );
  }
}
