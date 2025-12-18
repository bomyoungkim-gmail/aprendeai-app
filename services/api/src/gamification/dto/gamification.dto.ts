import { IsEnum, IsInt, IsNotEmpty, IsOptional } from 'class-validator';
import { DailyGoalType } from '@prisma/client';

export class SetDailyGoalDto {
  @IsNotEmpty()
  @IsEnum(DailyGoalType)
  goalType!: DailyGoalType;

  @IsNotEmpty()
  @IsInt()
  goalValue!: number;
}

export class ActivityProgressDto {
  @IsOptional()
  @IsInt()
  minutesSpentDelta?: number;

  @IsOptional()
  @IsInt()
  lessonsCompletedDelta?: number;
}
