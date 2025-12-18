import { IsEnum, IsString, IsArray, IsOptional } from 'class-validator';
import { AssetLayer, SessionModality } from '@prisma/client';

export class GenerateAssetDto {
  @IsEnum(AssetLayer)
  layer: AssetLayer;
  
  @IsString()
  educationLevel: string;
  
  @IsEnum(SessionModality)
  modality: SessionModality;
  
  @IsArray()
  @IsOptional()
  selectedHighlightIds?: string[];
  
  @IsString()
  @IsOptional()
  promptVersion?: string = 'v1.0';
}

export class AssetResponseDto {
  jobId?: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  asset?: any;
  estimatedTime?: number;
}

export class ListAssetsQueryDto {
  @IsEnum(AssetLayer)
  @IsOptional()
  layer?: AssetLayer;
  
  @IsString()
  @IsOptional()
  promptVersion?: string;
}
