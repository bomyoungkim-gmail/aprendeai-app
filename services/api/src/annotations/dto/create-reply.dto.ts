import { IsString, IsOptional } from "class-validator";

export class CreateReplyDto {
  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsString()
  color?: string;
}
