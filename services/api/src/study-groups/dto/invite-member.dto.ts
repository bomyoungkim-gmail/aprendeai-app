import { IsString, IsNotEmpty, IsEnum } from "class-validator";
import { GroupRole } from "@prisma/client";

export class InviteGroupMemberDto {
  @IsString()
  @IsNotEmpty()
  user_id: string;

  @IsEnum(GroupRole)
  role: GroupRole;
}
