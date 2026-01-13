import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsObject,
  IsArray,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

export class CheckpointAnswerItemDto {
  @IsString()
  @IsNotEmpty()
  questionId: string;

  @IsNotEmpty()
  userAnswer: any;

  @IsOptional()
  timeSpentSeconds?: number;
}

export class CheckpointAnswerDto {
  @IsString()
  @IsNotEmpty()
  checkpointId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CheckpointAnswerItemDto)
  answers: CheckpointAnswerItemDto[];

  @IsOptional()
  @IsString()
  sessionId?: string;

  @IsOptional()
  @IsObject()
  metadata?: any;
}

export class InterventionActionDto {
  @IsString()
  @IsNotEmpty()
  interventionId: string;

  @IsString()
  @IsNotEmpty()
  action: "ACCEPTED" | "DISMISSED" | "SNOOZED";

  @IsOptional()
  @IsObject()
  outcome?: any;
}
