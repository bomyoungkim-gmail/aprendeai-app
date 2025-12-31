import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
export interface ContentClassification {
    ageMin: number;
    ageMax: number;
    contentRating: "G" | "PG" | "PG-13" | "TEEN";
    complexity: "BASIC" | "INTERMEDIATE" | "ADVANCED";
    topics: string[];
    confidence: number;
}
export declare class ContentClassificationService {
    private readonly httpService;
    private readonly configService;
    constructor(httpService: HttpService, configService: ConfigService);
    classifyContent(content: {
        title: string;
        description?: string;
        body?: string;
        existingClassification?: Partial<ContentClassification>;
    }): Promise<ContentClassification>;
    private aiClassify;
    private extractKeywords;
    private determineComplexity;
    private determineAgeRange;
    private determineRating;
    filterContentByAge(items: any[], familyAgeRange: {
        minAge: number;
        maxAge: number;
    }): any[];
    suggestClassification(contentId: string, title: string, description?: string): Promise<{
        contentId: string;
        suggested: ContentClassification;
        message: string;
        needsReview: boolean;
    }>;
}
