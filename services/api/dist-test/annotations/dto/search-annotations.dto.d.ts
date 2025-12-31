import { AnnotationType } from "@prisma/client";
export declare class SearchAnnotationsDto {
    query?: string;
    type?: AnnotationType;
    userId?: string;
    contentId?: string;
    groupId?: string;
    color?: string;
    startDate?: string;
    endDate?: string;
    isFavorite?: boolean;
}
