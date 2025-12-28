import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  Min,
  Max,
} from "class-validator";
import { DailyGoalType } from "@prisma/client";

export class SetDailyGoalDto {
  @IsNotEmpty({ message: "Goal type is required" })
  @IsEnum(DailyGoalType, { message: "Goal type must be MINUTES or LESSONS" })
  goalType!: DailyGoalType;

  @IsNotEmpty({ message: "Goal value is required" })
  @IsInt({ message: "Goal value must be an integer" })
  @Min(1, { message: "Goal value must be at least 1" })
  @Max(1440, { message: "Goal value cannot exceed 1440 minutes (24 hours)" })
  goalValue!: number;
}

export class ActivityProgressDto {
  @IsOptional()
  @IsInt({ message: "Minutes spent must be an integer" })
  @Min(0, { message: "Minutes spent cannot be negative" })
  @Max(1440, { message: "Minutes spent cannot exceed 24 hours" })
  minutesSpentDelta?: number;

  @IsOptional()
  @IsInt({ message: "Lessons completed must be an integer" })
  @Min(0, { message: "Lessons completed cannot be negative" })
  @Max(100, { message: "Lessons completed delta seems unreasonably high" })
  @Max(100, { message: "Lessons completed delta seems unreasonably high" })
  lessonsCompletedDelta?: number;

  @IsOptional()
  focusScore?: number; // 0-100 score for this chunk/session

  @IsOptional()
  accuracyRate?: number; // 0-100 accuracy

  @IsOptional()
  activityType?: string; // 'reading', 'game', etc.
}
