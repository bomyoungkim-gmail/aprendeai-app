import { IsString, IsEmail, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FamilyRole } from '@prisma/client';

export class InviteMemberDto {
  @ApiProperty({ example: 'spouse@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ enum: FamilyRole, example: 'GUARDIAN' })
  @IsEnum(FamilyRole)
  role: FamilyRole;

  @ApiPropertyOptional({ example: 'Mom' })
  @IsOptional()
  @IsString()
  displayName?: string;
}
