import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsBoolean,
  IsInt,
  Min,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";

export class MetricsQueryDto {
  @ApiProperty({ description: "Metric name", example: "api_request" })
  @IsString()
  metric: string;

  @ApiProperty({
    description: "Start date (ISO string)",
    example: "2024-01-01T00:00:00Z",
  })
  @IsDateString()
  from: string;

  @ApiProperty({
    description: "End date (ISO string)",
    example: "2024-01-02T00:00:00Z",
  })
  @IsDateString()
  to: string;

  @ApiProperty({
    description: "Time bucket",
    enum: ["1m", "1h", "1d"],
    example: "1h",
  })
  @IsEnum(["1m", "1h", "1d"])
  bucket: string;
}

export class ErrorQueryDto {
  @ApiPropertyOptional({ description: "Start date" })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ description: "End date" })
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional({ description: "Filter by resolved status" })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  resolved?: boolean;

  @ApiPropertyOptional({ description: "Filter by endpoint" })
  @IsOptional()
  @IsString()
  endpoint?: string;

  @ApiPropertyOptional({ description: "Limit results" })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number;
}

export class UsageQueryDto {
  @ApiPropertyOptional({ description: "Provider name", example: "openai" })
  @IsOptional()
  @IsString()
  provider?: string;

  @ApiProperty({ description: "Start date" })
  @IsDateString()
  from: string;

  @ApiProperty({ description: "End date" })
  @IsDateString()
  to: string;
}

export class OverviewQueryDto {
  @ApiPropertyOptional({ description: "Hours to look back", example: 24 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  hours?: number;
}
