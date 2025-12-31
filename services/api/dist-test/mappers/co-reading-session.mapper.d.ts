import { co_reading_sessions } from "@prisma/client";
export declare class CoReadingSessionMapper {
    static toDto(session: co_reading_sessions): {
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
    static toCollectionDto(sessions: co_reading_sessions[]): {
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
    }[];
}
