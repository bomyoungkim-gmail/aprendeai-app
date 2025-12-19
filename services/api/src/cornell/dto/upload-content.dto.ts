import { IsString, IsEnum, IsOptional } from 'class-validator';
import { Language, SubscriptionScope } from '@prisma/client';

export class UploadContentDto {
  @IsString()
  title: string;

  @IsEnum(Language)
  originalLanguage: Language;

  @IsOptional()
  @IsEnum(SubscriptionScope)
  scopeType?: SubscriptionScope;

  @IsOptional()
  @IsString()
  scopeId?: string;
}
