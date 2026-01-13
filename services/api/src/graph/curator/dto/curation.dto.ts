import {
  IsString,
  IsNotEmpty,
  IsArray,
  ValidateNested,
  IsEnum,
  IsOptional,
  IsInt,
  Min,
  Max,
} from "class-validator";
import { Type } from "class-transformer";

enum CurationAction {
  PROMOTE = "PROMOTE",
  REJECT = "REJECT",
  NEEDS_REVIEW = "NEEDS_REVIEW",
}

class CurationItemDto {
  @IsString()
  @IsNotEmpty()
  edgeId: string;

  @IsEnum(CurationAction)
  action: CurationAction;
}

export class BatchCurationDto {
  @IsString()
  @IsNotEmpty()
  diffId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CurationItemDto)
  items: CurationItemDto[];

  @IsString()
  @IsNotEmpty()
  curatorUserId: string;
}

export class VoteEdgeDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  edgeId: string;

  @IsInt()
  @Min(-1)
  @Max(1)
  vote: number;

  @IsString()
  @IsOptional()
  comment?: string;
}
