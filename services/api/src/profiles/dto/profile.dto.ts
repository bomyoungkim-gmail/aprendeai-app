import { IsEnum, IsInt, Min, Max, IsOptional } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsEnum(['FUNDAMENTAL_1', 'FUNDAMENTAL_2', 'MEDIO', 'SUPERIOR', 'ADULTO_LEIGO'])
  educationLevel?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  readingLevelScore?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  listeningLevelScore?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  writingLevelScore?: number;

  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(480)
  dailyTimeBudgetMin?: number;
}
