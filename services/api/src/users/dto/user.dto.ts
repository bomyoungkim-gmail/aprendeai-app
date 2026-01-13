import {
  IsOptional,
  IsString,
  IsEnum,
  IsArray,
  IsDateString,
  IsInt,
  Min,
  Max,
  MaxLength,
  MinLength,
} from "class-validator";
import { Language } from "@prisma/client";
import { Transform } from "class-transformer";
import { Gender } from "../../shared/domain/user.types";

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Transform(({ value }) => value?.trim())
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
  schoolingLevel?: string; // String: 'FUNDAMENTAL', 'MEDIO', 'SUPERIOR', 'POS_GRADUACAO'

  @IsOptional()
  @IsString()
  @MaxLength(300)
  @Transform(({ value }) => value?.trim())
  address?: string;

  @IsOptional()
  @IsEnum(Gender)
  sex?: Gender;

  @IsOptional()
  @IsDateString()
  birthday?: string; // ISO date string

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(120)
  age?: number;
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
