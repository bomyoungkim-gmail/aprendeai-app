import { VocabService } from "../../vocab/vocab.service";
export declare class VocabCaptureListener {
    private vocabService;
    private readonly logger;
    constructor(vocabService: VocabService);
    handleSessionEvents(payload: {
        sessionId: string;
        eventTypes: string[];
    }): Promise<void>;
}
