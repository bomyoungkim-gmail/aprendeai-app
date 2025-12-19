import { IsOptional, IsString, IsEnum, IsArray, MaxLength, MinLength } from 'class-validator';
import { Language } from '@prisma/client';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @IsOptional()
  @IsEnum(Language)
  nativeLanguage?: Language;

  @IsOptional()
  @IsArray()
  @IsEnum(Language, { each: true })
  learningLanguages?: Language[];

  @IsOptional()
  @IsString()
  schoolingLevel?: string; // String: 'ELEMENTARY', 'MIDDLE', 'HIGH', 'COLLEGE', 'ADULT'
}

export class UpdateSettingsDto {
  @IsOptional()
  notifications?: {
    email?: boolean;
    groupInvites?: boolean;
    annotations?: boolean;
    sessionReminders?: boolean;
    weeklyDigest?: boolean;
  };

  @IsOptional()
  privacy?: {
    profileVisible?: boolean;
    showStats?: boolean;
    allowEmailDiscovery?: boolean;
  };
}

export class ChangePasswordDto {
  @IsString()
  @MinLength(6)
  currentPassword: string;

  @IsString()
  @MinLength(6)
  @MaxLength(100)
  newPassword: string;
}

export class ChangeEmailDto {
  @IsString()
  newEmail: string;

  @IsString()
  @MinLength(6)
  password: string;
}
