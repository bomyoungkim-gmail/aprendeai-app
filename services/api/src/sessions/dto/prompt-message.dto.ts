import {
  IsString,
  IsEnum,
  IsNotEmpty,
  MaxLength,
  ValidateNested,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ActorRole, UiMode, AssetLayer, ReadingIntent } from '../../common/enums';

export class PromptMetadataDto {
  @IsEnum(UiMode)
  uiMode: UiMode;

  @IsString()
  @IsNotEmpty()
  contentId: string;

  @IsEnum(AssetLayer)
  assetLayer: AssetLayer;

  @IsEnum(ReadingIntent)
  readingIntent: ReadingIntent;

  @IsString()
  @IsOptional()
  blockId?: string;

  @IsString()
  @IsOptional()
  chunkId?: string;

  @IsOptional()
  page?: number;

  @IsOptional()
  span?: { start: number; end: number };
}

export class PromptMessageDto {
  @IsString()
  @IsNotEmpty()
  threadId: string;

  @IsString()
  @IsNotEmpty()
  readingSessionId: string;

  @IsEnum(ActorRole)
  actorRole: ActorRole;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000, { message: 'Prompt text must not exceed 2000 characters' })
  text: string;

  @IsString()
  @IsNotEmpty()
  clientTs: string; // ISO timestamp

  @ValidateNested()
  @Type(() => PromptMetadataDto)
  metadata: PromptMetadataDto;
}
