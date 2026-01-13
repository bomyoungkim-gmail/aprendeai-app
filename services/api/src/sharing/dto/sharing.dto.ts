import { IsEnum, IsString, IsNotEmpty, IsUUID } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export enum ShareContextType {
  CLASSROOM = "CLASSROOM",
  FAMILY = "FAMILY",
  STUDY_GROUP = "STUDY_GROUP",
}

export enum SharePermission {
  VIEW = "VIEW",
  COMMENT = "COMMENT",
  ASSIGN = "ASSIGN",
}

export enum AnnotationShareMode {
  VIEW = "VIEW",
  COMMENT = "COMMENT",
}

export enum CommentTargetType {
  CONTENT = "CONTENT",
  ANNOTATION = "ANNOTATION",
  SUBMISSION = "SUBMISSION",
}

// 1) ShareContentRequest
export class ShareContentRequest {
  @ApiProperty({ enum: ShareContextType })
  @IsEnum(ShareContextType)
  contextType: ShareContextType;

  @ApiProperty()
  @IsUUID()
  contextId: string;

  @ApiProperty({ enum: SharePermission })
  @IsEnum(SharePermission)
  permission: SharePermission;
}

// 2) ShareAnnotationRequest
export class ShareAnnotationRequest {
  @ApiProperty({ enum: ShareContextType })
  @IsEnum(ShareContextType)
  contextType: ShareContextType;

  @ApiProperty()
  @IsUUID()
  contextId: string;

  @ApiProperty({ enum: AnnotationShareMode })
  @IsEnum(AnnotationShareMode)
  mode: AnnotationShareMode;
}

// 3) CreateCommentRequest
export class CreateCommentRequest {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  body: string;
}

// Threads Query DTO
export class GetThreadsQuery {
  @ApiProperty({ enum: ShareContextType })
  @IsEnum(ShareContextType)
  contextType: ShareContextType;

  @ApiProperty()
  @IsUUID()
  contextId: string;

  @ApiProperty({ enum: CommentTargetType })
  @IsEnum(CommentTargetType)
  targetType: CommentTargetType;

  @ApiProperty()
  @IsUUID()
  targetId: string;
}
