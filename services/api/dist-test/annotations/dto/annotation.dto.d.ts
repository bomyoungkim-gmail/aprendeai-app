import { AnnotationType, AnnotationVisibility } from "@prisma/client";
export declare class CreateAnnotationDto {
    type: AnnotationType;
    startOffset: number;
    endOffset: number;
    selectedText?: string;
    text?: string;
    color?: string;
    visibility: AnnotationVisibility;
    groupId?: string;
    parentId?: string;
}
export declare class UpdateAnnotationDto {
    text: string;
}
