import { IsString, IsNotEmpty } from 'class-validator';

export class AddContentDto {
  @IsString()
  @IsNotEmpty()
  contentId: string;
}
