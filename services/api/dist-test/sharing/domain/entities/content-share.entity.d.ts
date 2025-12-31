export declare enum ShareContextType {
    CLASSROOM = "CLASSROOM",
    STUDY_GROUP = "STUDY_GROUP",
    FAMILY = "FAMILY",
    PUBLIC = "PUBLIC"
}
export declare enum SharePermission {
    VIEW = "VIEW",
    EDIT = "EDIT",
    ASSIGN = "ASSIGN"
}
export declare class ContentShare {
    readonly contentId: string;
    readonly contextType: ShareContextType;
    readonly contextId: string;
    readonly permission: SharePermission;
    readonly createdBy: string;
    readonly createdAt: Date;
    constructor(contentId: string, contextType: ShareContextType, contextId: string, permission: SharePermission, createdBy: string, createdAt?: Date);
}
