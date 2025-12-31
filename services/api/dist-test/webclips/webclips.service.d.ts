import { CreateWebClipDto, StartWebClipSessionDto } from "./dto/webclip.dto";
import { IContentRepository } from "../cornell/domain/content.repository.interface";
import { ISessionsRepository } from "../sessions/domain/sessions.repository.interface";
import { Content } from "../cornell/domain/content.entity";
export declare class WebClipsService {
    private readonly contentRepository;
    private readonly sessionsRepository;
    constructor(contentRepository: IContentRepository, sessionsRepository: ISessionsRepository);
    createWebClip(user_id: string, dto: CreateWebClipDto): Promise<{
        contentId: string;
        readerUrl: string;
    }>;
    startSession(user_id: string, content_id: string, dto: StartWebClipSessionDto): Promise<{
        readingSessionId: string;
        sessionId: string;
        threadId: string;
        nextPrompt: string;
    }>;
    getWebClip(user_id: string, content_id: string): Promise<Content>;
}
