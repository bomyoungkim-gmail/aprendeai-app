import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsString, Min, Max } from "class-validator";

export class CreateBookmarkDto {
  @ApiProperty({ example: 10, description: "Page number" })
  @IsNumber()
  @Min(0)
  page_number: number;

  @ApiProperty({
    example: 20.0,
    description: "Scroll percentage",
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  scroll_pct?: number;

  @ApiProperty({
    example: "Important theorem",
    description: "Bookmark label",
    required: false,
  })
  @IsOptional()
  @IsString()
  label?: string;

  @ApiProperty({
    example: "#ff0000",
    description: "Color hex",
    required: false,
  })
  @IsOptional()
  @IsString()
  color?: string;
}
