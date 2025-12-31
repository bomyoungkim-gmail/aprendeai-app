import { Controller, Get, Post, Body, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/infrastructure/jwt-auth.guard";
import { CurrentUser } from "../auth/presentation/decorators/current-user.decorator";
import { users } from "@prisma/client";
import { OpsService } from "./ops.service";
import { LogTimeDto } from "./dto/ops.dto";
import { ROUTES } from "../common/constants/routes.constants";

@ApiTags("OpsCoach")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller(ROUTES.OPS.BASE) // Using centralized route
export class OpsController {
  constructor(private opsService: OpsService) {}

  /**
   * Get daily snapshot with progress, goals, and next tasks
   */
  @Get("daily-snapshot")
  @ApiOperation({ summary: "Get daily operational snapshot" })
  async getDailySnapshot(@CurrentUser() user: users) {
    return this.opsService.getDailySnapshot(user.id);
  }

  /**
   * Get prioritized "What's Next" task queue
   */
  @Get("what-next")
  @ApiOperation({ summary: "Get next prioritized tasks" })
  async getWhatsNext(@CurrentUser() user: users) {
    return this.opsService.getWhatsNext(user.id);
  }

  /**
   * Get dynamic context cards based on user state
   */
  @Get("context-cards")
  @ApiOperation({ summary: "Get context-aware action cards" })
  async getContextCards(@CurrentUser() user: users) {
    return this.opsService.getContextCards(user.id);
  }

  /**
   * Quick time logging endpoint
   */
  @Post("log")
  @ApiOperation({ summary: "Log time spent studying" })
  async logTime(@CurrentUser() user: users, @Body() dto: LogTimeDto) {
    return this.opsService.logTime(user.id, dto);
  }

  /**
   * Get daily boot prompt
   */
  @Get("boot")
  @ApiOperation({ summary: "Get daily boot prompt" })
  async getBootPrompt(@CurrentUser() user: users) {
    return this.opsService.getBootPrompt(user.id);
  }

  /**
   * Get daily close prompt
   */
  @Get("close")
  @ApiOperation({ summary: "Get daily close prompt" })
  async getClosePrompt(@CurrentUser() user: users) {
    return this.opsService.getClosePrompt(user.id);
  }
}
