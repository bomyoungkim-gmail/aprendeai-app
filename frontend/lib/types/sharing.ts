export enum ShareContextType {
  CLASSROOM = "CLASSROOM",
  FAMILY = "FAMILY",
  STUDY_GROUP = "STUDY_GROUP",
}

export enum CommentTargetType {
  CONTENT = "CONTENT",
  ANNOTATION = "ANNOTATION", // TODO: ROADMAP - UI integration for specific annotation threads
  SUBMISSION = "SUBMISSION", // TODO: ROADMAP - UI integration for task submission feedback threads
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

export interface ShareContentRequest {
  contextType: ShareContextType;
  contextId: string;
  permission: SharePermission;
}

export interface ShareAnnotationRequest {
  contextType: ShareContextType;
  contextId: string;
  mode: AnnotationShareMode;
}

export interface Comment {
  id: string;
  threadId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
}

export interface Thread {
  id: string;
  contextType: ShareContextType;
  contextId: string;
  targetType: CommentTargetType;
  targetId: string;
  comments: Comment[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommentDto {
  body: string;
}

export interface GetThreadsQuery {
  contextType: ShareContextType;
  contextId: string;
  targetType: CommentTargetType;
  targetId: string;
}
