import { ContentClassificationService } from "./content-classification.service";
export declare class ContentClassificationController {
    private classificationService;
    constructor(classificationService: ContentClassificationService);
    classifyContent(dto: {
        title: string;
        description?: string;
        body?: string;
        existingClassification?: any;
    }): Promise<import("./content-classification.service").ContentClassification>;
    suggestClassification(contentId: string, dto: {
        title: string;
        description?: string;
    }): Promise<{
        contentId: string;
        suggested: import("./content-classification.service").ContentClassification;
        message: string;
        needsReview: boolean;
    }>;
    filterContent(dto: {
        items: any[];
        familyAgeRange: {
            minAge: number;
            maxAge: number;
        };
    }): Promise<any[]>;
}
