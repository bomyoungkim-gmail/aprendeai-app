import { IsString, IsNumber, IsArray, IsBoolean, IsEnum, IsOptional, ArrayMinSize, ArrayMaxSize } from 'class-validator';

export class CreateFamilyPolicyDto {
  @IsString()
  familyId: string;

  @IsString()
  learnerUserId: string;

  @IsNumber()
  @IsOptional()
  timeboxDefaultMin?: number = 15;

  @IsNumber()
  @IsOptional()
  dailyMinMinutes?: number = 15;

  @IsNumber()
  @IsOptional()
  dailyReviewCap?: number = 20;

  @IsArray()
  @ArrayMinSize(0)
  @ArrayMaxSize(7)
  @IsOptional()
  coReadingDays?: number[] = [];

  @IsString()
  @IsOptional()
  coReadingTime?: string;

  @IsBoolean()
  @IsOptional()
  toolWordsGateEnabled?: boolean = true;

  @IsEnum(['AGGREGATED_ONLY', 'AGGREGATED_PLUS_TRIGGERS'])
  @IsOptional()
  privacyMode?: 'AGGREGATED_ONLY' | 'AGGREGATED_PLUS_TRIGGERS' = 'AGGREGATED_ONLY';
}

export class UpdateFamilyPolicyDto {
  @IsNumber()
  @IsOptional()
  timeboxDefaultMin?: number;

  @IsNumber()
  @IsOptional()
  dailyMinMinutes?: number;

  @IsNumber()
  @IsOptional()
  dailyReviewCap?: number;

  @IsArray()
  @ArrayMinSize(0)
  @ArrayMaxSize(7)
  @IsOptional()
  coReadingDays?: number[];

  @IsString()
  @IsOptional()
  coReadingTime?: string;

  @IsBoolean()
  @IsOptional()
  toolWordsGateEnabled?: boolean;

  @IsEnum(['AGGREGATED_ONLY', 'AGGREGATED_PLUS_TRIGGERS'])
  @IsOptional()
  privacyMode?: 'AGGREGATED_ONLY' | 'AGGREGATED_PLUS_TRIGGERS';
}
