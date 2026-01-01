import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ContentMode {
  NARRATIVE = 'NARRATIVE',
  DIDACTIC = 'DIDACTIC',
  TECHNICAL = 'TECHNICAL',
  NEWS = 'NEWS',
  SCIENTIFIC = 'SCIENTIFIC',
  LANGUAGE = 'LANGUAGE',
}

export class UpdateContentModeDto {
  @ApiProperty({
    enum: ContentMode,
    description: 'Content mode to set',
    example: ContentMode.DIDACTIC,
  })
  @IsEnum(ContentMode)
  mode: ContentMode;

  @ApiPropertyOptional({
    enum: ['PRODUCER', 'USER'],
    description: 'Source of the mode setting',
    example: 'USER',
  })
  @IsOptional()
  @IsString()
  source?: 'PRODUCER' | 'USER';
}
