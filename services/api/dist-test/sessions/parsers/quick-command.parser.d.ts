import { PromptMetadataDto } from "../dto/prompt-message.dto";
export interface ParsedEvent {
    eventType: string;
    payloadJson: any;
}
export declare class QuickCommandParser {
    parse(text: string, metadata: PromptMetadataDto): ParsedEvent[];
    private inferLanguage;
}
