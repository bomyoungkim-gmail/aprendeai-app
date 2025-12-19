import { IsString, IsNotEmpty, MaxLength, IsInt, Min } from 'class-validator';

export class SendChatMessageDto {
  @IsInt()
  @Min(1)
  roundIndex: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500, { message: 'Message cannot exceed 500 characters' })
  message: string;
}
