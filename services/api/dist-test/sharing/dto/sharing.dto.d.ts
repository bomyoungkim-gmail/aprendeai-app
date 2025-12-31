export declare enum ShareContextType {
    CLASSROOM = "CLASSROOM",
    FAMILY = "FAMILY",
    STUDY_GROUP = "STUDY_GROUP"
}
export declare enum SharePermission {
    VIEW = "VIEW",
    COMMENT = "COMMENT",
    ASSIGN = "ASSIGN"
}
export declare enum AnnotationShareMode {
    VIEW = "VIEW",
    COMMENT = "COMMENT"
}
export declare enum CommentTargetType {
    CONTENT = "CONTENT",
    ANNOTATION = "ANNOTATION",
    SUBMISSION = "SUBMISSION"
}
export declare class ShareContentRequest {
    contextType: ShareContextType;
    contextId: string;
    permission: SharePermission;
}
export declare class ShareAnnotationRequest {
    contextType: ShareContextType;
    contextId: string;
    mode: AnnotationShareMode;
}
export declare class CreateCommentRequest {
    body: string;
}
export declare class GetThreadsQuery {
    contextType: ShareContextType;
    contextId: string;
    targetType: CommentTargetType;
    targetId: string;
}
