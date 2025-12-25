import { IsEnum, IsOptional, IsString, IsUUID } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class VocabAttemptDto {
  @ApiProperty()
  @IsUUID()
  vocabId: string;

  @ApiProperty({ enum: ["FORM", "MEANING", "USE"] })
  @IsEnum(["FORM", "MEANING", "USE"])
  dimension: "FORM" | "MEANING" | "USE";

  @ApiProperty({ enum: ["FAIL", "HARD", "OK", "EASY"] })
  @IsEnum(["FAIL", "HARD", "OK", "EASY"])
  result: "FAIL" | "HARD" | "OK" | "EASY";

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  sessionId?: string;
}

export class ReviewQueueQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  limit?: string; // Will be parsed to number
}
