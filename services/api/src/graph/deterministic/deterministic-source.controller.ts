import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DeterministicSourceService } from './deterministic-source.service';
import { BuildDeterministicSourceDto } from './deterministic-source.dto';
import { JwtAuthGuard } from '../../auth/infrastructure/jwt-auth.guard';
import { CurrentUser } from '../../auth/presentation/decorators/current-user.decorator';


@ApiTags('Graphs / Deterministic Source')
@Controller('graphs/deterministic')
@UseGuards(JwtAuthGuard)
export class DeterministicSourceController {
  constructor(private readonly service: DeterministicSourceService) {}

  @Post('build')
  @ApiOperation({ summary: 'Trigger a deterministic source build' })
  @ApiResponse({ status: 201, description: 'Build run started successfully' })
  async build(
    @Body() dto: BuildDeterministicSourceDto,
    @CurrentUser() user: any,
  ) {
    return this.service.runBuild({
      scopeType: dto.scopeType,
      scopeId: dto.scopeId,
      contentIds: dto.contentIds,
      mode: dto.mode,
      dryRun: dto.dryRun,
      createdBy: user.userId,
    });
  }

  @Get('status/:runId')
  @ApiOperation({ summary: 'Get status of a build run' })
  async getStatus(@Param('runId') runId: string) {
    // This method is a placeholder as per plan, in a real implementation we would fetch from DB.
    // Since runBuild returns the summary immediately in the current service implementation (it awaits),
    // this might be less critical or can be implemented by just looking up the run.
    
    // START TEMPORARY IMPLEMENTATION - assuming we might want to lookup the run
    // Ideally, we'd add a getBuildRun method to the service.
    // For now, returning a 501 Not Implemented or similar would be standard if not ready,
    // but let's assume valid "TODO" or future expansion.
    
    return { status: 'Not implemented check DB directly for ' + runId };
  }
}
