import { IsString, IsNotEmpty, MinLength } from "class-validator";

/**
 * DTO for assigning a Productive Failure mission
 */
export class AssignPFDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  contentId: string;
}

/**
 * DTO for submitting a Productive Failure response
 */
export class SubmitPFResponseDto {
  @IsString()
  @IsNotEmpty()
  attemptId: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10, { message: "Response must be at least 10 characters" })
  responseText: string;
}

/**
 * DTO for requesting feedback generation
 */
export class GenerateFeedbackDto {
  @IsString()
  @IsNotEmpty()
  attemptId: string;
}
