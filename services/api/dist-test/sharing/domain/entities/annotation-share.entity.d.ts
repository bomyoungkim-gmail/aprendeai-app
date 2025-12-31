import { ShareContextType } from './content-share.entity';
export declare enum AnnotationShareMode {
    READ_ONLY = "READ_ONLY",
    COLLABORATIVE = "COLLABORATIVE"
}
export declare class AnnotationShare {
    readonly annotationId: string;
    readonly contextType: ShareContextType;
    readonly contextId: string;
    readonly mode: AnnotationShareMode;
    readonly createdBy: string;
    readonly createdAt: Date;
    constructor(annotationId: string, contextType: ShareContextType, contextId: string, mode: AnnotationShareMode, createdBy: string, createdAt?: Date);
}
