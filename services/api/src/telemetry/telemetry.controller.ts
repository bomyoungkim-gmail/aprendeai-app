import {
  Body,
  Controller,
  Post,
  Get,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiResponse,
} from "@nestjs/swagger";
import { TelemetryService } from "./telemetry.service";
import { TrackEventDto } from "./dto/track-event.dto";
import { JwtAuthGuard } from "../auth/infrastructure/jwt-auth.guard";
import { CurrentUser } from "../auth/presentation/decorators/current-user.decorator";

@ApiTags("Telemetry")
@Controller("telemetry")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TelemetryController {
  constructor(private readonly telemetryService: TelemetryService) {}

  @Post("track")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Track a telemetry event" })
  @ApiResponse({ status: 200, description: "Event queued successfully" })
  async track(@Body() dto: TrackEventDto, @CurrentUser() user: any) {
    // Fire and forget logic is handled inside service buffering,
    // but here we simply acknowledge receipt.
    // user.id comes from JwtStrategy
    await this.telemetryService.track(dto, user.id);
    return { success: true };
  }

  @Post("batch")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Track a batch of telemetry events" })
  @ApiResponse({ status: 200, description: "Events queued successfully" })
  async batchTrack(@Body() dtos: TrackEventDto[], @CurrentUser() user: any) {
    // Process all events in parallel promises or loop
    // Since track is buffering, this is fast.
    if (Array.isArray(dtos)) {
      for (const dto of dtos) {
        await this.telemetryService.track(dto, user.id);
      }
    }
    return { success: true, count: dtos.length };
  }

  @Get("stats/:contentId")
  @ApiOperation({ summary: "Get telemetry stats for content" })
  @ApiResponse({ status: 200, description: "Statistics retrieved" })
  async getStats(@Param("contentId") contentId: string) {
    return this.telemetryService.getStats(contentId);
  }
}
