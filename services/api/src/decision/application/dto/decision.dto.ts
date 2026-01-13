import {
  IsString,
  IsNotEmpty,
  IsOptional,
  ValidateNested,
  IsNumber,
  IsIn,
} from "class-validator";
import { Type } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

/**
 * DTO for decision signals
 */
export class DecisionSignalsDto {
  @ApiProperty({
    required: false,
    enum: ["USER_ASKS_ANALOGY", "CLICK_TIER2_HELP", "USER_EXPLICIT_ASK"],
    description: "Explicit user action triggering evaluation",
  })
  @IsOptional()
  @IsString()
  explicitUserAction?: string;

  @ApiProperty({
    description: "Number of doubts marked in last 90 seconds",
    example: 2,
  })
  @IsNumber()
  doubtsInWindow: number;

  @ApiProperty({
    description: "Number of consecutive checkpoint failures",
    example: 0,
  })
  @IsNumber()
  checkpointFailures: number;

  @ApiProperty({
    enum: ["FLOW", "LOW_FLOW", "ERRATIC"],
    description: "Current flow state based on user behavior",
  })
  @IsIn(["FLOW", "LOW_FLOW", "ERRATIC"])
  flowState: "FLOW" | "LOW_FLOW" | "ERRATIC";

  @ApiProperty({
    enum: ["EMPTY", "SHORT", "OK"],
    description: "Quality of post-session summary",
  })
  @IsIn(["EMPTY", "SHORT", "OK"])
  summaryQuality: "EMPTY" | "SHORT" | "OK";
}

/**
 * DTO for decision evaluation request
 */
export class EvaluateDecisionDto {
  @ApiProperty({
    description: "User ID",
    example: "user_123",
  })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: "Session ID",
    example: "session_456",
  })
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @ApiProperty({
    description: "Content ID",
    example: "content_789",
  })
  @IsString()
  @IsNotEmpty()
  contentId: string;

  @ApiProperty({
    description: "Chunk ID (optional)",
    required: false,
  })
  @IsOptional()
  @IsString()
  chunkId?: string;

  @ApiProperty({
    description: "UI Policy Version",
    example: "1.0.0",
  })
  @IsString()
  @IsNotEmpty()
  uiPolicyVersion: string;

  @ApiProperty({
    description: "Decision signals",
    type: DecisionSignalsDto,
  })
  @ValidateNested()
  @Type(() => DecisionSignalsDto)
  signals: DecisionSignalsDto;
}

/**
 * DTO for decision response
 */
export class DecisionResponseDto {
  @ApiProperty({
    enum: [
      "NO_OP",
      "SHOW_HINT",
      "ASK_PROMPT",
      "ASSIGN_MISSION",
      "CALL_AGENT",
      "GUIDED_SYNTHESIS",
    ],
    description: "Recommended action",
  })
  action: string;

  @ApiProperty({
    enum: ["DETERMINISTIC", "CACHED_LLM", "LLM", "TOOL_RAG", "HUMAN_IN_LOOP"],
    description: "Channel used for decision",
  })
  channel: string;

  @ApiProperty({
    enum: [
      "USER_EXPLICIT_ASK",
      "DOUBT_SPIKE",
      "VOCAB_MARKED",
      "CHECKPOINT_FAIL",
      "POST_SUMMARY",
      "LOW_FLOW",
      "HIGH_SWITCH_COST",
      "SRS_DUE",
      "TEACHER_TRIGGER",
      "PARENT_TRIGGER",
      "NO_TRIGGER",
    ],
    description: "Reason for the decision",
  })
  reason: string;

  @ApiProperty({
    description: "Additional payload (mission ID, prompt, etc.)",
    required: false,
  })
  payload?: any;
}
