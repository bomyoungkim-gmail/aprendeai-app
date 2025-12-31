export interface TranscriptionSegment {
    id: number;
    seek: number;
    start: number;
    end: number;
    text: string;
    tokens: number[];
    temperature: number;
    avg_logprob: number;
    compression_ratio: number;
    no_speech_prob: number;
}
export interface TranscriptionWord {
    word: string;
    start: number;
    end: number;
}
export interface Transcription {
    text: string;
    language?: string;
    duration?: number;
    segments: TranscriptionSegment[];
    words?: TranscriptionWord[];
}
export declare class TranscriptionService {
    private readonly logger;
    private openai;
    constructor();
    transcribe(filePath: string): Promise<Transcription>;
    generateWebVTT(transcription: Transcription): string;
    private formatTime;
    isAvailable(): boolean;
}
