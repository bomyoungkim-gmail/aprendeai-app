import { ICornellRepository } from "../../domain/interfaces/cornell.repository.interface";
import { UsageTrackingService } from "../../../billing/usage-tracking.service";
import { ActivityService } from "../../../activity/activity.service";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { UpdateCornellDto } from "../../dto/cornell.dto";
import { CornellNote } from "../../domain/entities/cornell-note.entity";
export declare class UpdateCornellNoteUseCase {
    private readonly cornellRepository;
    private readonly usageTracking;
    private readonly activityService;
    private readonly eventEmitter;
    constructor(cornellRepository: ICornellRepository, usageTracking: UsageTrackingService, activityService: ActivityService, eventEmitter: EventEmitter2);
    execute(contentId: string, userId: string, dto: UpdateCornellDto): Promise<CornellNote>;
    private getEnvironment;
}
