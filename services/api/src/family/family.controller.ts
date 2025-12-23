import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { FamilyService } from './family.service';
import { FamilyPolicyService } from './services/family-policy.service';
import { CoReadingService } from './services/co-reading.service';
import { TeachBackService } from './services/teachback.service';
import { FamilyDashboardService } from './services/family-dashboard.service';
import { OpsCoachService } from './services/ops-coach.service';
import { CreateFamilyDto } from './dto/create-family.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { CreateFamilyPolicyDto } from './dto/family-policy.dto';
import { StartCoSessionDto, StartTeachBackDto } from './dto/co-session.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard'; // Adjust import if needed
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '@prisma/client';

@ApiTags('Family')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('families')
export class FamilyController {
  constructor(
    private readonly familyService: FamilyService,
    private readonly policyService: FamilyPolicyService,
    private readonly coReadingService: CoReadingService,
    private readonly teachBackService: TeachBackService,
    private readonly dashboardService: FamilyDashboardService,
    private readonly opsCoachService: OpsCoachService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new family' })
  create(@CurrentUser() user: User, @Body() createFamilyDto: CreateFamilyDto) {
    return this.familyService.create(user.id, createFamilyDto);
  }

  @Get()
  @ApiOperation({ summary: 'List my families' })
  findAll(@CurrentUser() user: User) {
    return this.familyService.findAllForUser(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get family details' })
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.familyService.findOne(id, user.id);
  }

  @Post(':id/invite')
  @ApiOperation({ summary: 'Invite a member to the family' })
  invite(@Param('id') id: string, @CurrentUser() user: User, @Body() inviteDto: InviteMemberDto) {
    return this.familyService.inviteMember(id, user.id, inviteDto);
  }

  @Post(':id/accept')
  @ApiOperation({ summary: 'Accept invitation to join family' })
  acceptInvite(@Param('id') id: string, @CurrentUser() user: User) {
    return this.familyService.acceptInvite(id, user.id);
  }

  @Get(':id/usage')
  @ApiOperation({ summary: 'Get family usage analytics' })
  getUsage(@Param('id') id: string, @CurrentUser() user: User) {
    return this.familyService.getAnalytics(id, user.id);
  }

  @Delete(':id/members/:memberUserId')
  @ApiOperation({ summary: 'Remove a member from the family' })
  removeMember(
    @Param('id') id: string,
    @Param('memberUserId') memberUserId: string,
    @CurrentUser() user: User,
  ) {
    return this.familyService.removeMember(id, user.id, memberUserId);
  }

  @Post(':id/transfer-ownership')
  @ApiOperation({ summary: 'Transfer family ownership' })
  transferOwnership(
    @Param('id') id: string, 
    @CurrentUser() user: User,
    @Body('newOwnerId') newOwnerId: string
  ) {
    return this.familyService.transferOwnership(id, user.id, newOwnerId);
  }

  @Post(':id/primary')
  @ApiOperation({ summary: 'Set family as primary context' })
  setPrimary(@Param('id') id: string, @CurrentUser() user: User) {
    return this.familyService.setPrimaryFamily(user.id, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a family' })
  deleteFamily(@Param('id') id: string, @CurrentUser() user: User) {
    return this.familyService.deleteFamily(id, user.id);
  }

  // ============================================
  // FAMILY MODE (New Endpoints)
  // ============================================

  @Post('policy')
  @ApiOperation({ summary: 'Create family policy' })
  createPolicy(@Body() dto: CreateFamilyPolicyDto) {
    return this.policyService.create(dto);
  }

  @Get(':familyId/educator-dashboard/:learnerId')
  @ApiOperation({ summary: 'Get educator dashboard' })
  getEducatorDashboard(@Param('familyId') familyId: string, @Param('learnerId') learnerId: string) {
    return this.dashboardService.getEducatorDashboard(familyId, learnerId);
  }

  @Post('co-sessions/start')
  @ApiOperation({ summary: 'Start co-reading session' })
  startCoSession(@Body() dto: StartCoSessionDto) {
    return this.coReadingService.start(dto);
  }

  @Post('teachback/start')
  @ApiOperation({ summary: 'Start teach-back session' })
  startTeachBack(@Body() dto: StartTeachBackDto) {
    return this.teachBackService.start(dto);
  }

  // ============================================
  // PROMPT-ONLY ENDPOINTS (Phase 10)
  // ============================================

  @Post('policy/:policyId/prompt')
  @ApiOperation({ summary: 'Get policy confirmation prompt' })
  getPolicyConfirmationPrompt(@Param('policyId') policyId: string) {
    return this.policyService.getConfirmationPrompt(policyId);
  }

  @Post('co-sessions/:id/finish')
  @ApiOperation({ summary: 'Finish co-reading session' })
  finishCoSession(@Param('id') sessionId: string, @Body() body: { context: any }) { 
    if (body.context.startedAt) body.context.startedAt = new Date(body.context.startedAt);
    if (body.context.phaseStartedAt) body.context.phaseStartedAt = new Date(body.context.phaseStartedAt);
    return this.coReadingService.finish(sessionId, body.context);
  }

  @Post('co-sessions/:id/prompt')
  @ApiOperation({ summary: 'Get co-reading session prompt' })
  getCoSessionPrompt(@Param('id') sessionId: string, @Body() body: { phase: string }) {
    // Return appropriate prompt based on current phase
    const promptKeys = {
      BOOT: 'OPS_DAILY_BOOT_LEARNER',
      PRE: 'READ_PRE_CHOICE_SKIM',
      DURING: 'READ_DURING_MARK_RULE',
      POST: 'READ_POST_FREE_RECALL',
    };
    return this.opsCoachService.getDailyBootLearner(); // TODO (Issue #1): Use phase-based logic
  }

  @Post('teachback/:id/prompt')
  @ApiOperation({ summary: 'Get teach-back step prompt' })
  getTeachBackPrompt(@Param('id') sessionId: string, @Body() body: { step: number }) {
    const step = body.step || 1;
    // TODO (Issue #2): Get learnerUserId from Session Context
    if (step === 1) return this.teachBackService.offerMission('learner_id');
    if (step === 2) return this.teachBackService.getStep2Prompt();
    if (step === 3) return this.teachBackService.getStep3Prompt();
    return { error: 'Invalid step' };
  }

  @Post('teachback/:id/finish')
  @ApiOperation({ summary: 'Finish teach-back session' })
  finishTeachBackSession(@Param('id') sessionId: string, @Body() body: { stars: number }) {
    return this.teachBackService.finish(sessionId, body.stars);
  }

  @Post('reports/weekly/prompt')
  @ApiOperation({ summary: 'Get weekly report prompt' })
  getWeeklyReportPrompt(@Body() body: { streak: number; compAvg: number }) {
    return this.opsCoachService.getWeeklyReportEducator(body.streak, body.compAvg);
  }
}
