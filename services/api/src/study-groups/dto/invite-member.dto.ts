import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { GroupRole } from '@prisma/client';

export class InviteMemberDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsEnum(GroupRole)
  role: GroupRole;
}
