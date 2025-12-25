import { IsString, IsEnum, IsOptional, IsArray } from "class-validator";

export enum CaptureMode {
  SELECTION = "SELECTION",
  READABILITY = "READABILITY",
}

export class CreateWebClipDto {
  @IsString()
  sourceUrl: string;

  @IsString()
  title: string;

  @IsString()
  siteDomain: string;

  @IsEnum(CaptureMode)
  captureMode: CaptureMode;

  @IsString()
  @IsOptional()
  selectionText?: string;

  @IsString()
  @IsOptional()
  contentText?: string;

  @IsString()
  @IsOptional()
  languageHint?: "PT_BR" | "EN" | "KO"; // Fixed: PT_BR matches Prisma enum

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}

export class StartWebClipSessionDto {
  @IsString()
  @IsOptional()
  assetLayer?: string = "L1";

  @IsEnum(["inspectional", "analytical"])
  @IsOptional()
  readingIntent?: "inspectional" | "analytical" = "inspectional";

  @IsOptional()
  timeboxMin?: number = 15;
}
