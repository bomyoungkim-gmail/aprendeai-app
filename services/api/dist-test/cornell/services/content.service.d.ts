import { PrismaService } from "../../prisma/prisma.service";
import { StorageService } from "./storage.service";
import { UploadContentDto } from "../dto/upload-content.dto";
import { contents as Content, ContentType, Language } from "@prisma/client";
import { VideoService } from "../../video/video.service";
import { TranscriptionService } from "../../transcription/transcription.service";
import { EnforcementService } from "../../billing/enforcement.service";
import { FamilyService } from "../../family/family.service";
import { UsageTrackingService } from "../../billing/usage-tracking.service";
import { ActivityService } from "../../activity/activity.service";
import { TopicMasteryService } from "../../analytics/topic-mastery.service";
export declare class ContentService {
    private readonly prisma;
    private readonly storageService;
    private readonly videoService;
    private readonly transcriptionService;
    private readonly enforcementService;
    private readonly familyService;
    private readonly usageTracking;
    private readonly activityService;
    private readonly topicMastery;
    private readonly logger;
    constructor(prisma: PrismaService, storageService: StorageService, videoService: VideoService, transcriptionService: TranscriptionService, enforcementService: EnforcementService, familyService: FamilyService, usageTracking: UsageTrackingService, activityService: ActivityService, topicMastery: TopicMasteryService);
    uploadContent(file: Express.Multer.File, dto: UploadContentDto, userId: string): Promise<Content>;
    createManualContent(userId: string, dto: any): Promise<Content>;
    private extractText;
    private extractPdfText;
    private extractDocxText;
    private getContentType;
    private transcribeInBackground;
    searchContent(query: string, filters: {
        type?: ContentType;
        language?: Language;
        page?: number;
        limit?: number;
        recommendForUserId?: string;
    }, userId: string): Promise<{
        results: {
            id: string;
            title: string;
            type: import(".prisma/client").$Enums.ContentType;
            originalLanguage: import(".prisma/client").$Enums.Language;
            excerpt: string;
            highlights: string[];
            createdAt: Date;
        }[];
        metadata: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
            hasMore: boolean;
        };
    }>;
    getContent(contentId: string, userId: string): Promise<any>;
    private generateExcerpt;
    private findHighlights;
    canAccessContent(contentId: string, userId: string): Promise<boolean>;
    private escapeRegex;
    updateContent(id: string, userId: string, dto: any): Promise<Content>;
}
