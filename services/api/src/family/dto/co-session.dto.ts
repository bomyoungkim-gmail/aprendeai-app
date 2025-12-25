import { IsString, IsNumber, IsOptional, Min, Max } from "class-validator";

export class StartCoSessionDto {
  @IsString()
  familyId: string;

  @IsString()
  learnerUserId: string;

  @IsString()
  educatorUserId: string;

  @IsString()
  readingSessionId: string;

  @IsString()
  contentId: string;

  @IsNumber()
  @Min(5)
  @Max(60)
  @IsOptional()
  timeboxMin?: number = 20;
}

export class StartTeachBackDto {
  @IsString()
  familyId: string;

  @IsString()
  childUserId: string; // Child as EDUCATOR

  @IsString()
  parentUserId: string; // Parent as LEARNER

  @IsString()
  baseReadingSessionId: string;

  @IsNumber()
  @Min(5)
  @Max(8)
  @IsOptional()
  durationMin?: number = 7;
}
