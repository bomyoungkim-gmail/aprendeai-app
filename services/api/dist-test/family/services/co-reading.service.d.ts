import { PrismaService } from "../../prisma/prisma.service";
import { FamilyEventService } from "../../events/family-event.service";
import { CoReadingStateMachine } from "../../state-machine/co-reading-state-machine.service";
import { PromptLibraryService } from "../../prompts/prompt-library.service";
import { CoReadingPhase, CoReadingContext } from "../../state-machine/types";
import { StartCoSessionDto } from "../dto/co-session.dto";
export declare class CoReadingService {
    private prisma;
    private familyEventService;
    private stateMachine;
    private promptLibrary;
    constructor(prisma: PrismaService, familyEventService: FamilyEventService, stateMachine: CoReadingStateMachine, promptLibrary: PromptLibraryService);
    start(dto: StartCoSessionDto): Promise<{
        coSession: {
            id: string;
            familyId: string;
            learnerUserId: string;
            educatorUserId: string;
            readingSessionId: string;
            threadIdLearner: string;
            threadIdEducator: string;
            timeboxMin: number;
            type: import(".prisma/client").$Enums.CoSessionType;
            status: import(".prisma/client").$Enums.CoReadingStatus;
            startedAt: Date;
            endedAt: Date;
        };
        context: CoReadingContext;
        nextPrompts: {
            learner: import("../../prompts/dto/canonical-prompt.dto").CanonicalPrompt;
            educator: import("../../prompts/dto/canonical-prompt.dto").CanonicalPrompt;
        };
    }>;
    transitionPhase(coSessionId: string, targetPhase: CoReadingPhase, context: CoReadingContext): Promise<{
        success: boolean;
        newPhase: CoReadingPhase;
        nextPrompt: import("../../prompts/dto/canonical-prompt.dto").CanonicalPrompt;
    }>;
    handleCheckpointFail(context: CoReadingContext): Promise<{
        shouldIntervene: boolean;
        failCount: number;
        educatorPrompt: import("../../prompts/dto/canonical-prompt.dto").CanonicalPrompt;
    } | {
        shouldIntervene: boolean;
        failCount: number;
        educatorPrompt?: undefined;
    }>;
    getById(coSessionId: string): Promise<{
        reading_sessions: {
            id: string;
            content_id: string;
            content_version_id: string | null;
            user_id: string;
            phase: import(".prisma/client").$Enums.SessionPhase | null;
            started_at: Date;
            finished_at: Date | null;
            modality: import(".prisma/client").$Enums.SessionModality | null;
            asset_layer: string | null;
            goal_statement: string | null;
            prediction_text: string | null;
            target_words_json: import("@prisma/client/runtime/library").JsonValue | null;
        };
        families: {
            id: string;
            created_at: Date;
            updated_at: Date;
            name: string | null;
            owner_user_id: string;
            join_code: string | null;
        };
        users_educator: {
            id: string;
            created_at: Date;
            updated_at: Date;
            name: string;
            email: string;
            bio: string | null;
            address: string | null;
            sex: string | null;
            birthday: Date | null;
            age: number | null;
            password_hash: string | null;
            system_role: import(".prisma/client").$Enums.SystemRole | null;
            last_context_role: import(".prisma/client").$Enums.ContextRole;
            last_institution_id: string | null;
            oauth_provider: string | null;
            oauth_id: string | null;
            oauth_picture: string | null;
            schooling_level: string | null;
            preferred_languages: import("@prisma/client/runtime/library").JsonValue;
            last_login_at: Date | null;
            status: string;
            avatar_url: string | null;
            settings: import("@prisma/client/runtime/library").JsonValue | null;
            sso_provider: string | null;
            sso_subject: string | null;
            password_reset_token: string | null;
            password_reset_expires: Date | null;
        };
        users_learner: {
            id: string;
            created_at: Date;
            updated_at: Date;
            name: string;
            email: string;
            bio: string | null;
            address: string | null;
            sex: string | null;
            birthday: Date | null;
            age: number | null;
            password_hash: string | null;
            system_role: import(".prisma/client").$Enums.SystemRole | null;
            last_context_role: import(".prisma/client").$Enums.ContextRole;
            last_institution_id: string | null;
            oauth_provider: string | null;
            oauth_id: string | null;
            oauth_picture: string | null;
            schooling_level: string | null;
            preferred_languages: import("@prisma/client/runtime/library").JsonValue;
            last_login_at: Date | null;
            status: string;
            avatar_url: string | null;
            settings: import("@prisma/client/runtime/library").JsonValue | null;
            sso_provider: string | null;
            sso_subject: string | null;
            password_reset_token: string | null;
            password_reset_expires: Date | null;
        };
    } & {
        id: string;
        type: import(".prisma/client").$Enums.CoSessionType;
        status: import(".prisma/client").$Enums.CoReadingStatus;
        family_id: string;
        learner_user_id: string;
        educator_user_id: string;
        reading_session_id: string;
        thread_id_learner: string;
        thread_id_educator: string;
        timebox_min: number;
        started_at: Date;
        ended_at: Date | null;
    }>;
    finish(coSessionId: string, context: CoReadingContext): Promise<import("../../state-machine/types").PhaseTransitionResult>;
}
