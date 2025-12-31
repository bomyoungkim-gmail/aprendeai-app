export declare class CornellNote {
    id: string;
    contentId: string;
    userId: string;
    cues: any[];
    notes: any[];
    summary: string;
    createdAt?: Date;
    updatedAt?: Date;
    constructor(partial: Partial<CornellNote>);
}
