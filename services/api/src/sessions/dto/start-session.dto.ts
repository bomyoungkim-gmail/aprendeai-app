import {
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsBoolean,
  Min,
  Max,
  ValidateNested,
} from "class-validator";
import { AssetLayer, ReadingIntent } from "../../common/enums";

export class LongTextConfigDto {
  @IsOptional()
  @IsString()
  planId?: string;

  @IsOptional()
  @IsNumber()
  unitIndex?: number;
}

export class StartSessionDto {
  @IsString()
  contentId: string;

  @IsOptional()
  @IsString()
  contentVersionId?: string;

  @IsOptional()
  @IsEnum(AssetLayer)
  assetLayer?: AssetLayer;

  @IsOptional()
  @IsEnum(ReadingIntent)
  readingIntent?: ReadingIntent;

  @IsOptional()
  @IsNumber()
  @Min(10)
  @Max(60)
  timeboxMin?: number;

  @IsOptional()
  @ValidateNested()
  longText?: LongTextConfigDto;

  /**
   * UI override for ContentMode (Script 02 - P2)
   * Allows frontend to override inferred content mode for this session
   */
  @IsOptional()
  @IsEnum([
    "TECHNICAL",
    "DIDACTIC",
    "NARRATIVE",
    "NEWS",
    "SCIENTIFIC",
    "LANGUAGE",
  ])
  uiMode?:
    | "TECHNICAL"
    | "DIDACTIC"
    | "NARRATIVE"
    | "NEWS"
    | "SCIENTIFIC"
    | "LANGUAGE";

  /**
   * Whether to persist the uiMode override to the database
   * If true, saves uiMode with mode_source='USER'
   */
  @IsOptional()
  @IsBoolean()
  persistUiMode?: boolean;
}

export class FinishSessionDto {
  @IsEnum(["USER_FINISHED", "TIMEOUT", "ERROR"])
  reason: "USER_FINISHED" | "TIMEOUT" | "ERROR";
}
