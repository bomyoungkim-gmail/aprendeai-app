import {
  IsString,
  IsEnum,
  IsBoolean,
  IsArray,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ActorRole } from '../../common/enums';

export class HilRequestDto {
  @IsBoolean()
  required: boolean;

  @IsEnum(ActorRole)
  actorRole: ActorRole;

  @IsString()
  question: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[];
}

export class AgentTurnResponseDto {
  @IsString()
  threadId: string;

  @IsString()
  readingSessionId: string;

  @IsString()
  nextPrompt: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  quickReplies?: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => HilRequestDto)
  hilRequest?: HilRequestDto;

  @IsOptional()
  eventsToWrite?: any[]; // Detailed validation later
}
