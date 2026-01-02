import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsString, Min, Max } from "class-validator";

export class UpdateReadingProgressDto {
  @ApiProperty({ example: 5, description: "Last page read" })
  @IsNumber()
  @Min(0)
  last_page: number;

  @ApiProperty({ example: 45.5, description: "Scroll percentage (0-100)" })
  @IsNumber()
  @Min(0)
  @Max(100)
  last_scroll_pct: number;

  @ApiProperty({
    example: "Desktop/Web",
    description: "Client device info",
    required: false,
  })
  @IsOptional()
  @IsString()
  device_info?: string;
}
