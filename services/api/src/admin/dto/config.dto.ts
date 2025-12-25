import { IsString, IsEnum, IsOptional } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ConfigType, Environment } from "@prisma/client";

export class ConfigFilterDto {
  @ApiPropertyOptional({ description: "Filter by category" })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    description: "Filter by environment",
    enum: Environment,
  })
  @IsOptional()
  @IsEnum(Environment)
  environment?: Environment;
}

export class CreateConfigDto {
  @ApiProperty({
    description: "Config key (unique)",
    example: "openai.api_key",
  })
  @IsString()
  key: string;

  @ApiProperty({ description: "Config value" })
  @IsString()
  value: string;

  @ApiProperty({ description: "Value type", enum: ConfigType })
  @IsEnum(ConfigType)
  type: ConfigType;

  @ApiProperty({ description: "Config category", example: "provider" })
  @IsString()
  category: string;

  @ApiPropertyOptional({
    description: "Environment (null = all)",
    enum: Environment,
  })
  @IsOptional()
  @IsEnum(Environment)
  environment?: Environment;

  @ApiPropertyOptional({ description: "Human-readable description" })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: "Additional metadata (JSON)" })
  @IsOptional()
  metadata?: any;
}

export class UpdateConfigDto {
  @ApiPropertyOptional({ description: "New value" })
  @IsOptional()
  @IsString()
  value?: string;

  @ApiPropertyOptional({ description: "Updated description" })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: "Updated metadata" })
  @IsOptional()
  metadata?: any;
}

export class ValidateProviderDto {
  @ApiProperty({ description: "Provider configuration (varies by provider)" })
  config: any;
}
