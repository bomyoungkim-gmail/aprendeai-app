import { IsString, IsNotEmpty, IsInt, IsObject } from 'class-validator';

export class SubmitEventDto {
  @IsInt()
  roundIndex: number;

  @IsString()
  @IsNotEmpty()
  eventType: string;

  @IsObject()
  payload: any;
}
