import { IsEnum, IsNotEmpty, IsOptional, IsString, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ContentMode } from '@prisma/client';

export class UpdateContentModeDto {
  @ApiProperty({
    enum: ContentMode,
    description: 'Content mode to set',
    example: ContentMode.DIDACTIC,
  })
  @IsEnum(ContentMode)
  @IsNotEmpty()
  mode: ContentMode;

  @ApiPropertyOptional({
    enum: ['PRODUCER', 'USER'],
    description: 'Source of the mode setting',
    example: 'USER',
  })
  @IsOptional()
  @IsString()
  @IsIn(['PRODUCER', 'USER'])
  source?: 'PRODUCER' | 'USER';
}
