import { IsString, IsOptional, IsDateString, IsEnum, IsInt, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
  PREFER_NOT_TO_SAY = 'PREFER_NOT_TO_SAY',
}

export enum EducationLevel {
  FUNDAMENTAL = 'FUNDAMENTAL',
  MEDIO = 'MEDIO',
  SUPERIOR = 'SUPERIOR',
  POS_GRADUACAO = 'POS_GRADUACAO',
}

export class UpdateUserProfileDto {
  @ApiPropertyOptional({ example: 'João da Silva' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  name?: string;

  @ApiPropertyOptional({ enum: EducationLevel, example: EducationLevel.MEDIO })
  @IsOptional()
  @IsEnum(EducationLevel)
  schoolingLevel?: EducationLevel;

  @ApiPropertyOptional({ example: 'Rua Example, 123 - São Paulo, SP' })
  @IsOptional()
  @IsString()
 @Transform(({ value }) => value?.trim())
  address?: string;

  @ApiPropertyOptional({ enum: Gender, example: Gender.MALE })
  @IsOptional()
  @IsEnum(Gender)
  sex?: Gender;

  @ApiPropertyOptional({ example: '1990-01-15', description: 'Date of birth in ISO format' })
  @IsOptional()
  @IsDateString()
  birthday?: string;

  @ApiPropertyOptional({ example: 25, minimum: 1, maximum: 120 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(120)
  age?: number;

  @ApiPropertyOptional({ example: 'Short bio about the user' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  bio?: string;
}
