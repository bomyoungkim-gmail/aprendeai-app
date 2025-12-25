import {
  IsString,
  IsEnum,
  IsBoolean,
  IsArray,
  IsOptional,
  ValidateNested,
  IsNumber,
} from "class-validator";
import { Type } from "class-transformer";
import { ActorRole } from "../../common/enums";

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

  @IsOptional()
  @ValidateNested()
  @Type(() => TokenUsageDto)
  usage?: TokenUsageDto;
}

export class TokenUsageDto {
  @IsNumber()
  prompt_tokens: number;

  @IsNumber()
  completion_tokens: number;

  @IsNumber()
  total_tokens: number;

  @IsOptional()
  @IsNumber()
  cost_est_usd?: number;
}
