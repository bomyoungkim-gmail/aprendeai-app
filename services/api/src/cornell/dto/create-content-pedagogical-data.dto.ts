import { IsObject, IsOptional, IsString } from "class-validator";

export class CreateContentPedagogicalDataDto {
  @IsObject()
  @IsOptional()
  vocabularyTriage?: any;

  @IsObject()
  @IsOptional()
  socraticQuestions?: any;

  @IsObject()
  @IsOptional()
  quizQuestions?: any;

  @IsObject()
  @IsOptional()
  tabooCards?: any;

  @IsObject()
  @IsOptional()
  bossFightConfig?: any;

  @IsObject()
  @IsOptional()
  freeRecallPrompts?: any;

  @IsString()
  @IsOptional()
  processingVersion?: string;
}
