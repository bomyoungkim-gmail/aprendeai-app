import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Get,
  Query,
} from "@nestjs/common";
import { GraphLearnerService } from "../application/graph-learner.service";
import { GraphEventDto } from "../application/dto/graph-event.dto";
import { JwtAuthGuard } from "../../auth/infrastructure/jwt-auth.guard";
import { CurrentUser } from "../../auth/presentation/decorators/current-user.decorator";

@Controller("graph/learner")
@UseGuards(JwtAuthGuard)
export class GraphLearnerController {
  constructor(private readonly graphLearnerService: GraphLearnerService) {}

  @Post("events")
  @HttpCode(HttpStatus.ACCEPTED)
  async handleEvent(@Body() dto: GraphEventDto): Promise<{ message: string }> {
    await this.graphLearnerService.handleGraphEvent(dto);
    return { message: "Graph event processed" };
  }

  @Get()
  async getGraph(
    @CurrentUser() user: any,
    @Query("contentId") contentId: string,
  ) {
    if (!contentId) {
      throw new Error("contentId query parameter is required");
    }
    return this.graphLearnerService.getVisualizationGraph(user.id, contentId);
  }
}
