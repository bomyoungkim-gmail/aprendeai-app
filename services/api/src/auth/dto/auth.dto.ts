import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  IsUUID,
} from "class-validator";

export class RegisterDto {
  @IsNotEmpty({ message: "Name is required" })
  @IsString()
  @MinLength(2, { message: "Name must be at least 2 characters" })
  @MaxLength(100, { message: "Name cannot exceed 100 characters" })
  name!: string;

  @IsEmail({}, { message: "Please provide a valid email address" })
  email!: string;

  @IsNotEmpty({ message: "Password is required" })
  @MinLength(8, {
    message: "Password must be at least 8 characters for security",
  })
  @MaxLength(100, { message: "Password is too long" })
  password!: string;

  @IsOptional()
  @IsUUID("4", { message: "Institution ID must be a valid UUID" })
  institutionId?: string;

  @IsOptional()
  @IsString()
  schoolingLevel?: string;
}

export class LoginDto {
  @IsEmail({}, { message: "Please provide a valid email address" })
  email!: string;

  @IsNotEmpty({ message: "Password is required" })
  password!: string;
}

export class ForgotPasswordDto {
  @IsEmail({}, { message: "Please provide a valid email address" })
  email!: string;
}

export class ResetPasswordDto {
  @IsNotEmpty({ message: "Token is required" })
  @IsString()
  token!: string;

  @IsNotEmpty({ message: "New password is required" })
  @MinLength(8, {
    message: "Password must be at least 8 characters for security",
  })
  @MaxLength(100, { message: "Password is too long" })
  password!: string;
}
