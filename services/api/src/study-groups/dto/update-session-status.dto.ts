import { IsEnum } from "class-validator";
import { GroupSessionStatus } from "@prisma/client";

export class UpdateSessionStatusDto {
  @IsEnum(GroupSessionStatus)
  status: GroupSessionStatus;
}
