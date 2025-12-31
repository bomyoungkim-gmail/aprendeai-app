import { EventEmitter2 } from "@nestjs/event-emitter";
import { PrismaService } from "../../prisma/prisma.service";
import { TopicMasteryService } from "../../analytics/topic-mastery.service";
import { SubmitQuestionResultDto, QuestionResultWithAnalyticsDto } from "../dto/question-result.dto";
export declare class QuestionAnalyticsService {
    private prisma;
    private topicMastery;
    private eventEmitter;
    private readonly logger;
    private activeGameSessions;
    constructor(prisma: PrismaService, topicMastery: TopicMasteryService, eventEmitter: EventEmitter2);
    recordResult(userId: string, dto: SubmitQuestionResultDto): Promise<QuestionResultWithAnalyticsDto>;
    private trackGameSession;
    private updateQuestionStats;
    private calculateNextReview;
}
