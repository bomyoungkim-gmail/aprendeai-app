import {
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
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
}

export class FinishSessionDto {
  @IsEnum(["USER_FINISHED", "TIMEOUT", "ERROR"])
  reason: "USER_FINISHED" | "TIMEOUT" | "ERROR";
}
