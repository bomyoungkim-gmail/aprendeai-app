import { IsString, IsNotEmpty } from "class-validator";

export class CompareGraphsDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  contentId: string;
}
