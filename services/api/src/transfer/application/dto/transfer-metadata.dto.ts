import { IsString, IsOptional, IsEnum } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class BuildTransferMetadataDto {
  @ApiProperty({ description: "Content ID to process" })
  @IsString()
  contentId: string;

  @ApiProperty({
    description: "Scope type for metadata",
    enum: ["USER", "FAMILY", "INSTITUTION", "GLOBAL"],
  })
  @IsEnum(["USER", "FAMILY", "INSTITUTION", "GLOBAL"])
  scopeType: string;

  @ApiProperty({ description: "Family ID if scope is FAMILY", required: false })
  @IsOptional()
  @IsString()
  familyId?: string;

  @ApiProperty({
    description: "Institution ID if scope is INSTITUTION",
    required: false,
  })
  @IsOptional()
  @IsString()
  institutionId?: string;
}

export class GetTransferMetadataDto {
  @ApiProperty({ description: "Content ID" })
  @IsString()
  contentId: string;

  @ApiProperty({ description: "Chunk ID", required: false })
  @IsOptional()
  @IsString()
  chunkId?: string;

  @ApiProperty({ description: "Chunk index (fallback)", required: false })
  @IsOptional()
  chunkIndex?: number;

  @ApiProperty({ description: "Page number (fallback)", required: false })
  @IsOptional()
  pageNumber?: number;

  @ApiProperty({
    description: "Scope type",
    enum: ["USER", "FAMILY", "INSTITUTION", "GLOBAL"],
  })
  @IsEnum(["USER", "FAMILY", "INSTITUTION", "GLOBAL"])
  scopeType: string;
}
