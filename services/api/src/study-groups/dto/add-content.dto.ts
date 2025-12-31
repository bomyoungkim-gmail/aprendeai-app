import { IsString, IsNotEmpty } from "class-validator";

export class AddContentDto {
  @IsString()
  @IsNotEmpty()
  content_id: string;
}
