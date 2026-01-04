import { IsString, IsNotEmpty, IsOptional, IsObject, IsEnum } from 'class-validator';

export enum GraphEventType {
  HIGHLIGHT = 'HIGHLIGHT',
  CORNELL_SYNTHESIS = 'CORNELL_SYNTHESIS',
  MISSION_COMPLETED = 'MISSION_COMPLETED',
}

export class GraphEventDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  contentId: string;

  @IsString()
  @IsOptional()
  sessionId?: string;

  @IsEnum(GraphEventType)
  eventType: GraphEventType;

  @IsObject()
  eventData: any; // Polymorphic payload

  @IsString()
  @IsOptional()
  sectionRef?: string; // For context (e.g., chunk_id, page_number)
}
