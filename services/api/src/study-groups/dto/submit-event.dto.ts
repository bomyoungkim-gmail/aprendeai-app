import { IsString, IsNotEmpty, IsInt, IsObject } from "class-validator";

export class SubmitEventDto {
  @IsInt()
  round_index: number;

  @IsString()
  @IsNotEmpty()
  event_type: string;

  @IsObject()
  payload: any;
}
