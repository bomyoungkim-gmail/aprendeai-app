import { IsOptional, IsString, IsEnum, IsNotEmpty } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateSecretDto {
  @ApiProperty({ description: "Unique secret key", example: "openai_api_key" })
  @IsNotEmpty()
  @IsString()
  key: string;

  @ApiProperty({ description: "Display name", example: "OpenAI API Key" })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: "Secret value (will be encrypted)",
    example: "sk-...",
  })
  @IsNotEmpty()
  @IsString()
  value: string;

  @ApiPropertyOptional({
    description: "Provider identifier",
    example: "openai",
  })
  @IsOptional()
  @IsString()
  provider?: string;

  @ApiPropertyOptional({
    description: "Target environment",
    enum: ["DEV", "STAGING", "PROD"],
  })
  @IsOptional()
  @IsEnum(["DEV", "STAGING", "PROD"])
  environment?: string;
}

export class UpdateSecretDto {
  @ApiProperty({ description: "New secret value" })
  @IsNotEmpty()
  @IsString()
  value: string;

  @ApiProperty({ description: "Reason for rotation/update (for audit)" })
  @IsNotEmpty()
  @IsString()
  reason: string;
}

export class DeleteSecretDto {
  @ApiProperty({ description: "Reason for deletion (required for audit)" })
  @IsNotEmpty()
  @IsString()
  reason: string;
}

export class SecretFilterDto {
  @ApiPropertyOptional({ description: "Filter by provider" })
  @IsOptional()
  @IsString()
  provider?: string;

  @ApiPropertyOptional({
    description: "Filter by environment",
    enum: ["DEV", "STAGING", "PROD"],
  })
  @IsOptional()
  @IsEnum(["DEV", "STAGING", "PROD"])
  environment?: string;
}
