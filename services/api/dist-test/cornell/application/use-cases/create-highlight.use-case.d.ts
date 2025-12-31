import { IHighlightsRepository } from "../../domain/interfaces/highlights.repository.interface";
import { UsageTrackingService } from "../../../billing/usage-tracking.service";
import { ActivityService } from "../../../activity/activity.service";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { CreateHighlightDto } from "../../dto/cornell.dto";
import { Highlight } from "../../domain/entities/highlight.entity";
export declare class CreateHighlightUseCase {
    private readonly highlightsRepository;
    private readonly usageTracking;
    private readonly activityService;
    private readonly eventEmitter;
    constructor(highlightsRepository: IHighlightsRepository, usageTracking: UsageTrackingService, activityService: ActivityService, eventEmitter: EventEmitter2);
    execute(contentId: string, userId: string, dto: CreateHighlightDto): Promise<Highlight>;
    private getEnvironment;
}
