import {
  Controller,
  Post,
  Get,
  Put,
  Param,
  Body,
  Query,
  Request,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { GroupSessionsService } from "./group-sessions.service";
import { GroupRoundsService } from "./group-rounds.service";
import { CreateSessionDto } from "./dto/create-session.dto";
import { UpdateSessionStatusDto } from "./dto/update-session-status.dto";
import { UpdatePromptDto } from "./dto/update-prompt.dto";
import { AdvanceRoundDto } from "./dto/advance-round.dto";
import { SubmitEventDto } from "./dto/submit-event.dto";

@Controller("group-sessions")
@UseGuards(AuthGuard("jwt"))
export class GroupSessionsController {
  constructor(
    private readonly groupSessionsService: GroupSessionsService,
    private readonly groupRoundsService: GroupRoundsService,
  ) {}

  @Post()
  async createSession(
    @Query("groupId") groupId: string,
    @Body() dto: CreateSessionDto,
    @Request() req,
  ) {
    return this.groupSessionsService.createSession(groupId, req.user.id, dto);
  }

  @Get(":sessionId")
  async getSession(@Param("sessionId") sessionId: string, @Request() req) {
    return this.groupSessionsService.getSession(sessionId, req.user.id);
  }

  @Put(":sessionId/start")
  async startSession(@Param("sessionId") sessionId: string, @Request() req) {
    await this.groupSessionsService.startSession(sessionId, req.user.id);
    return { message: "Session started" };
  }

  @Put(":sessionId/status")
  async updateStatus(
    @Param("sessionId") sessionId: string,
    @Body() dto: UpdateSessionStatusDto,
    @Request() req,
  ) {
    await this.groupSessionsService.updateSessionStatus(
      sessionId,
      req.user.id,
      dto.status,
    );
    return { message: "Session status updated" };
  }

  @Put(":sessionId/rounds/:roundIndex/prompt")
  async updatePrompt(
    @Param("sessionId") sessionId: string,
    @Param("roundIndex") roundIndex: string,
    @Body() dto: UpdatePromptDto,
    @Request() req,
  ) {
    return this.groupRoundsService.updatePrompt(
      sessionId,
      parseInt(roundIndex),
      req.user.id,
      dto,
    );
  }

  @Post(":sessionId/rounds/:roundIndex/advance")
  async advanceRound(
    @Param("sessionId") sessionId: string,
    @Param("roundIndex") roundIndex: string,
    @Body() dto: AdvanceRoundDto,
    @Request() req,
  ) {
    return this.groupRoundsService.advanceRound(
      sessionId,
      parseInt(roundIndex),
      req.user.id,
      dto.toStatus,
    );
  }

  @Post(":sessionId/events")
  async submitEvent(
    @Param("sessionId") sessionId: string,
    @Body() dto: SubmitEventDto,
    @Request() req,
  ) {
    return this.groupRoundsService.submitEvent(sessionId, req.user.id, dto);
  }

  @Get(":sessionId/events")
  async getEvents(
    @Param("sessionId") sessionId: string,
    @Query("roundIndex") roundIndex?: string,
  ) {
    const index = roundIndex ? parseInt(roundIndex) : undefined;
    return this.groupRoundsService.getEvents(sessionId, index);
  }

  @Get(":sessionId/shared-cards")
  async getSharedCards(@Param("sessionId") sessionId: string) {
    return this.groupRoundsService.getSharedCards(sessionId);
  }
}
