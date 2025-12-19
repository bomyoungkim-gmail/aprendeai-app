import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { SubscriptionScope } from '@prisma/client';

export class CreateGroupDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsEnum(SubscriptionScope)
  scopeType?: SubscriptionScope;

  @IsOptional()
  @IsString()
  scopeId?: string;
}
