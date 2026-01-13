import { IsString, IsNotEmpty } from "class-validator";

export class GeneratePkmDto {
  @IsString()
  @IsNotEmpty()
  sessionId: string;
}
