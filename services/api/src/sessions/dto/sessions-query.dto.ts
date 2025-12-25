import {
  IsOptional,
  IsInt,
  Min,
  Max,
  IsDateString,
  IsEnum,
  IsString,
} from "class-validator";
import { Type } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

export class SessionsQueryDto {
  @ApiProperty({ required: false, minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ required: false, minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiProperty({
    required: false,
    description: "Filter sessions since this date (ISO 8601)",
  })
  @IsOptional()
  @IsDateString()
  since?: string;

  @ApiProperty({
    required: false,
    description: "Filter sessions until this date (ISO 8601)",
  })
  @IsOptional()
  @IsDateString()
  until?: string;

  @ApiProperty({ required: false, enum: ["PRE", "DURING", "POST"] })
  @IsOptional()
  @IsEnum(["PRE", "DURING", "POST"])
  phase?: "PRE" | "DURING" | "POST";

  @ApiProperty({ required: false, description: "Search in content title" })
  @IsOptional()
  @IsString()
  query?: string;

  @ApiProperty({
    required: false,
    enum: ["startedAt", "duration"],
    default: "startedAt",
  })
  @IsOptional()
  @IsEnum(["startedAt", "duration"])
  sortBy?: "startedAt" | "duration" = "startedAt";

  @ApiProperty({ required: false, enum: ["asc", "desc"], default: "desc" })
  @IsOptional()
  @IsEnum(["asc", "desc"])
  sortOrder?: "asc" | "desc" = "desc";
}
