import { IsOptional, IsString, IsArray } from "class-validator";

export class UpdatePkmNoteDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  bodyMd?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  backlinks?: Record<string, string[]>;
}
