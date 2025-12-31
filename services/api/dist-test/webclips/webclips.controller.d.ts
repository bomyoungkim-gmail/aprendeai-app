import { users } from "@prisma/client";
import { WebClipsService } from "./webclips.service";
import { CreateWebClipDto, StartWebClipSessionDto } from "./dto/webclip.dto";
export declare class WebClipsController {
    private readonly webClipsService;
    constructor(webClipsService: WebClipsService);
    createWebClip(user: users, dto: CreateWebClipDto): Promise<{
        contentId: string;
        readerUrl: string;
    }>;
    startSession(user: users, contentId: string, dto: StartWebClipSessionDto): Promise<{
        readingSessionId: string;
        sessionId: string;
        threadId: string;
        nextPrompt: string;
    }>;
    getWebClip(user: users, contentId: string): Promise<import("../cornell/domain/content.entity").Content>;
}
