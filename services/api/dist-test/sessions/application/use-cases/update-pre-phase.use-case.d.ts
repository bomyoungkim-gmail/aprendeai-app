import { ISessionsRepository } from "../../domain/sessions.repository.interface";
import { ReadingSession } from "../../domain/reading-session.entity";
import { ProfileService } from "../../../profiles/profile.service";
export interface UpdatePrePhaseData {
    goalStatement: string;
    predictionText: string;
    targetWordsJson: any[];
}
export declare class UpdatePrePhaseUseCase {
    private readonly sessionsRepository;
    private readonly profileService;
    constructor(sessionsRepository: ISessionsRepository, profileService: ProfileService);
    execute(sessionId: string, userId: string, data: UpdatePrePhaseData): Promise<ReadingSession>;
    private getMinTargetWords;
}
