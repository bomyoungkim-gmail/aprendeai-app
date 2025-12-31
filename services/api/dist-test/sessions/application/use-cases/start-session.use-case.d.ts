import { ISessionsRepository } from "../../domain/sessions.repository.interface";
import { ReadingSession } from "../../domain/reading-session.entity";
import { ProfileService } from "../../../profiles/profile.service";
import { GatingService } from "../../../gating/gating.service";
import { IContentRepository } from "../../../cornell/domain/content.repository.interface";
export declare class StartSessionUseCase {
    private readonly sessionsRepository;
    private readonly profileService;
    private readonly gatingService;
    private readonly contentRepository;
    constructor(sessionsRepository: ISessionsRepository, profileService: ProfileService, gatingService: GatingService, contentRepository: IContentRepository);
    execute(userId: string, contentId: string): Promise<ReadingSession & {
        minTargetWords: number;
    }>;
    private getMinTargetWords;
}
