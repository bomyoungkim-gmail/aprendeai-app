import { IsEnum, IsNotEmpty, IsObject, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ContentMode } from '@prisma/client';

export class TrackEventDto {
  @ApiProperty({
    description: 'Type of the telemetry event',
    example: 'INTERACTION_SCROLL',
  })
  @IsString()
  @IsNotEmpty()
  eventType: string;

  @ApiPropertyOptional({
    description: 'Version of the event schema',
    example: '1.0.0',
    default: '1.0.0',
  })
  @IsString()
  @IsOptional()
  eventVersion: string = '1.0.0';

  @ApiPropertyOptional({
    description: 'Version of the UI policy active during the event',
    example: '2025-01-01',
  })
  @IsString()
  @IsOptional()
  uiPolicyVersion?: string;

  @ApiProperty({
    description: 'ID of the content being interacted with',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  contentId: string;

  @ApiProperty({
    description: 'ID of the user session',
    example: 'session-123',
  })
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @ApiPropertyOptional({
    description: 'Active content mode during the event',
    enum: ContentMode,
    example: ContentMode.DIDACTIC,
  })
  @IsOptional()
  @IsEnum(ContentMode)
  mode?: ContentMode;

  @ApiPropertyOptional({
    description: 'Additional event data (JSON)',
    example: { scrollDepth: 50, duration: 120 },
  })
  @IsObject()
  @IsOptional()
  data?: Record<string, any>;
}
