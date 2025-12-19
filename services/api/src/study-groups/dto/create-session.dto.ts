import { IsString, IsNotEmpty, IsEnum, IsOptional, IsInt, Min, Max } from 'class-validator';
import { GroupSessionMode } from '@prisma/client';

export class CreateSessionDto {
  @IsString()
  @IsNotEmpty()
  contentId: string;

  @IsOptional()
  @IsEnum(GroupSessionMode)
  mode?: GroupSessionMode = 'PI_SPRINT';

  @IsOptional()
  @IsString()
  layer?: string = 'L1';

  @IsInt()
  @Min(1)
  @Max(10)
  roundsCount: number;
}
