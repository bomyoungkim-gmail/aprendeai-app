import { IsEnum } from "class-validator";
import { RoundStatus } from "@prisma/client";

export class AdvanceRoundDto {
  @IsEnum(RoundStatus)
  toStatus: RoundStatus;
}
