import { IsString, IsNotEmpty, IsOptional, IsArray, IsObject } from 'class-validator';

export class CreatePkmNoteDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  bodyMd: string;

  @IsString()
  @IsOptional()
  topicNodeId?: string;

  @IsArray()
  @IsOptional()
  tags?: string[];

  @IsObject()
  @IsOptional()
  backlinks?: Record<string, any>;

  @IsObject()
  @IsOptional()
  sourceMetadata?: Record<string, any>;
}
