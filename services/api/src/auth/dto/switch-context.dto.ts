import { IsString, IsOptional } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class SwitchContextDto {
  @ApiProperty({
    required: false,
    nullable: true,
    description:
      "Target Institution ID to switch to. Null to switch to personal context.",
  })
  @IsString()
  @IsOptional()
  activeInstitutionId?: string | null;
}
