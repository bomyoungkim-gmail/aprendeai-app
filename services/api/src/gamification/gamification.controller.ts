import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { GamificationService } from './gamification.service';
import { AuthGuard } from '@nestjs/passport';
import { ActivityProgressDto, SetDailyGoalDto } from './dto/gamification.dto';

@Controller('gamification')
@UseGuards(AuthGuard('jwt'))
export class GamificationController {
  constructor(private readonly gamificationService: GamificationService) {}

  @Get('dashboard')
  getDashboard(@Request() req: any) {
    return this.gamificationService.getDashboard(req.user.id);
  }

  @Post('goal')
  setGoal(@Request() req: any, @Body() dto: SetDailyGoalDto) {
    return this.gamificationService.setDailyGoal(req.user.id, dto);
  }

  @Post('activity')
  registerActivity(@Request() req: any, @Body() dto: ActivityProgressDto) {
    return this.gamificationService.registerActivity(req.user.id, dto);
  }
}
