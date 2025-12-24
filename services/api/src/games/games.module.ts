import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { GamesController } from './games.controller';
import { GamesService } from './games.service';
import { GameProgressService } from './game-progress.service';
import { GameLeaderboardService } from './game-leaderboard.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [HttpModule, PrismaModule],
  controllers: [GamesController],
  providers: [GamesService, GameProgressService, GameLeaderboardService],
  exports: [GamesService, GameProgressService, GameLeaderboardService],
})
export class GamesModule {}
