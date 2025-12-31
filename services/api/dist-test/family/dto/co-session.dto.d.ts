export declare class StartCoSessionDto {
    familyId: string;
    learnerUserId: string;
    educatorUserId: string;
    readingSessionId: string;
    contentId: string;
    timeboxMin?: number;
}
export declare class StartTeachBackDto {
    familyId: string;
    childUserId: string;
    parentUserId: string;
    baseReadingSessionId: string;
    durationMin?: number;
}
