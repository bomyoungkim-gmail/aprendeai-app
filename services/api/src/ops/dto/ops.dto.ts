import { IsNumber, IsOptional, IsString, IsArray } from 'class-validator';

export class DailySnapshotDto {
  userId: string;
  date: Date;
  progress: ProgressDto;
  goals: GoalsDto;
  nextTasks: TaskDto[];
}

export class ProgressDto {
  @IsNumber()
  minutesToday: number;

  @IsNumber()
  lessonsCompleted: number;

  @IsNumber()
  comprehensionAvg: number;

  @IsNumber()
  streakDays: number;
  
  goalMet: boolean;
}

export class GoalsDto {
  @IsNumber()
  dailyMinutes: number;

  @IsNumber()
  @IsOptional()
  dailyLessons?: number;

  @IsString()
  goalType: 'MINUTES' | 'LESSONS';
}

export class TaskDto {
  @IsString()
  id: string;

  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsNumber()
  estimatedMin: number;

  @IsString()
  type: 'REVIEW' | 'CO_READING' | 'LESSON' | 'ASSESSMENT';

  @IsString()
  @IsOptional()
  ctaUrl?: string;

  @IsString()
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

export class ContextCardDto {
  @IsString()
  id: string;

  @IsString()
  type: 'CO_READING' | 'REVIEW_DUE' | 'WEEKLY_PLAN' | 'STREAK_ALERT';

  @IsString()
  title: string;

  @IsString()
  message: string;

  @IsString()
  ctaText: string;

  @IsString()
  ctaUrl: string;

  @IsString()
  @IsOptional()
  icon?: string;

  @IsString()
  @IsOptional()
  color?: string;
}

export class LogTimeDto {
  @IsNumber()
  minutes: number;

  @IsString()
  @IsOptional()
  activity?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
