import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsInt,
  Min,
  Max,
} from "class-validator";
import { GroupSessionMode } from "@prisma/client";

// Assuming RoundStatus is an enum that needs to be defined or imported
// For the purpose of this edit, I'll define a placeholder enum.
// In a real application, this would likely come from a shared types file or Prisma.
export class CreateSessionDto {
  @IsString()
  @IsNotEmpty()
  content_id: string;

  @IsOptional()
  @IsEnum(GroupSessionMode)
  mode?: GroupSessionMode = "PI_SPRINT";

  @IsOptional()
  @IsString()
  layer?: string = "L1";

  @IsInt()
  @Min(1)
  @Max(10)
  rounds_count: number;
}
