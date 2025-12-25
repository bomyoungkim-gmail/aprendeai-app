import { IsString, IsNotEmpty } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateFamilyDto {
  @ApiProperty({ example: "Smith Family" })
  @IsString()
  @IsNotEmpty()
  name: string;
}
