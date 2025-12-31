import { IsString, IsOptional, IsArray } from "class-validator";

export class UpdatePromptDto {
  @IsString()
  prompt_text: string;

  @IsOptional()
  @IsArray()
  options?: string[];

  @IsOptional()
  @IsArray()
  linked_highlight_ids?: string[];
}
