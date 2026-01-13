import { Controller, Post, Body, UseGuards, Logger } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBody } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../auth/infrastructure/jwt-auth.guard"; // Adjust path if needed
import { GraphBackfillService } from "./graph-backfill.service";

class BackfillDto {
  target: "BASELINE" | "LEARNER" | "DIFF";
  scopeId?: string; // userId or contentId
}

@ApiTags("Graph Admin")
@Controller("admin/graph/backfill")
@UseGuards(JwtAuthGuard)
export class GraphBackfillController {
  private readonly logger = new Logger(GraphBackfillController.name);

  constructor(private readonly backfillService: GraphBackfillService) {}

  @Post()
  @ApiOperation({ summary: "Backfill graph data" })
  @ApiBody({ type: BackfillDto })
  async triggerBackfill(@Body() dto: BackfillDto) {
    this.logger.log(`Received backfill request: ${JSON.stringify(dto)}`);

    switch (dto.target) {
      case "BASELINE":
        return this.backfillService.backfillBaseline(dto.scopeId);
      case "LEARNER":
        return this.backfillService.backfillLearner(dto.scopeId!);
      case "DIFF":
        return this.backfillService.backfillDiffs(dto.scopeId!);
      default:
        return { error: "Invalid target" };
    }
  }
}
