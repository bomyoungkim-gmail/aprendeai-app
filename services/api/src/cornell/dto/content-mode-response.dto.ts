import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ContentMode } from '@prisma/client';

export class ContentModeResponseDto {
  @ApiPropertyOptional({
    enum: ContentMode,
    description: 'Current content mode',
    example: ContentMode.DIDACTIC,
  })
  mode: ContentMode | null;

  @ApiPropertyOptional({
    enum: ['PRODUCER', 'USER', 'HEURISTIC'],
    description: 'Source of the mode setting',
    example: 'USER',
  })
  modeSource: string | null;

  @ApiPropertyOptional({
    description: 'User ID or SYSTEM who set the mode',
    example: 'user_123',
  })
  modeSetBy: string | null;

  @ApiPropertyOptional({
    description: 'Timestamp when mode was set',
    example: '2025-01-01T00:00:00.000Z',
  })
  modeSetAt: Date | null;

  @ApiPropertyOptional({
    enum: ContentMode,
    description: 'Inferred mode based on heuristics (if mode is null)',
    example: ContentMode.NARRATIVE,
  })
  inferredMode?: ContentMode;
}
