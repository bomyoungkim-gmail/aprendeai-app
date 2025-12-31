import { IsNumber, IsObject, IsOptional, IsString } from "class-validator";

export class CreateGameResultDto {
  @IsString()
  gameType: string;

  @IsNumber()
  score: number;

  @IsObject()
  @IsOptional()
  metadata?: any;
}
