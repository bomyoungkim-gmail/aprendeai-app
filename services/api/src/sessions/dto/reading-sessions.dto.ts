import { IsString, IsNotEmpty, IsArray, ArrayMinSize, MinLength } from 'class-validator';

export class PrePhaseDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(10, { message: 'Goal statement must be at least 10 characters' })
  goalStatement: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10, { message: 'Prediction must be at least 10 characters' })
  predictionText: string;

  @IsArray()
  @ArrayMinSize(3, { message: 'Minimum 3 target words required' })
  targetWordsJson: string[];
}

export class RecordEventDto {
  @IsString()
  @IsNotEmpty()
  eventType: 'MARK_UNKNOWN_WORD' | 'MARK_KEY_IDEA' | 'CHECKPOINT_RESPONSE' | 'QUIZ_RESPONSE' | 'PRODUCTION_SUBMIT';

  @IsNotEmpty()
  payload: any;
}

export class AdvancePhaseDto {
  @IsString()
  @IsNotEmpty()
  toPhase: 'POST' | 'FINISHED';
}
