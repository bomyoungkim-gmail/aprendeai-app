import { IsString, IsNumber, IsOptional, IsEnum, IsDate, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateClassroomDto {
  @IsString()
  ownerEducatorUserId: string;

  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  institutionId?: string;

  @IsString()
  @IsOptional()
  gradeLevel?: string;
}

export class UpdateClassroomDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  gradeLevel?: string;
}

export class EnrollStudentDto {
  @IsString()
  @IsOptional()
  classroomId?: string;

  @IsString()
  learnerUserId: string;

  @IsString()
  @IsOptional()
  nickname?: string;
}

export class CreateClassPolicyDto {
  @IsString()
  @IsOptional()
  classroomId?: string;

  @IsNumber()
  @IsOptional()
  weeklyUnitsTarget?: number = 3;

  @IsNumber()
  @IsOptional()
  timeboxDefaultMin?: number = 20;

  @IsNumber()
  @IsOptional()
  dailyReviewCap?: number = 30;

  @IsEnum(['AGGREGATED_ONLY', 'AGGREGATED_PLUS_HELP_REQUESTS', 'AGGREGATED_PLUS_FLAGS'])
  @IsOptional()
  privacyMode?: 'AGGREGATED_ONLY' | 'AGGREGATED_PLUS_HELP_REQUESTS' | 'AGGREGATED_PLUS_FLAGS' = 'AGGREGATED_ONLY';

  @IsEnum(['PROMPT_COACH', 'PROMPT_COACH_PLUS_1ON1'])
  @IsOptional()
  interventionMode?: 'PROMPT_COACH' | 'PROMPT_COACH_PLUS_1ON1' = 'PROMPT_COACH';
}

export class CreateWeeklyPlanDto {
  @IsDate()
  @Type(() => Date)
  weekStart: Date;

  @IsArray()
  @IsString({ each: true })
  items: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  toolWords?: string[];
}

export class LogInterventionDto {
  @IsString()
  learnerUserId: string;

  @IsString()
  topic: string;
}

export class GetPolicyPromptDto {
  @IsNumber()
  units: number;

  @IsNumber()
  minutes: number;
}

export class GetWeeklyPlanPromptDto {
  @IsNumber()
  unitsTarget: number;
}

export class GetInterventionPromptDto {
  @IsString()
  studentName: string;

  @IsString()
  topic: string;
}

export class GetDashboardPromptDto {
  @IsNumber()
  activeCount: number;

  @IsNumber()
  avgComprehension: number;
}
