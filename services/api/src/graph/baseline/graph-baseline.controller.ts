import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { GraphBaselineService } from "./graph-baseline.service";
import { BuildBaselineDto } from "./dto/build-baseline.dto";
import { JwtAuthGuard } from "../../auth/infrastructure/jwt-auth.guard";

@Controller("graph/baseline")
@UseGuards(JwtAuthGuard)
export class GraphBaselineController {
  constructor(private readonly graphBaselineService: GraphBaselineService) {}

  @Post("build")
  @HttpCode(HttpStatus.ACCEPTED)
  async buildBaseline(
    @Body() dto: BuildBaselineDto,
  ): Promise<{ graphId: string }> {
    return this.graphBaselineService.buildBaseline(dto);
  }
}
