export interface VideoMetadata {
    duration: number;
    width?: number;
    height?: number;
    codec?: string;
    bitrate?: number;
    hasAudio: boolean;
    fps?: number;
}
export interface AudioMetadata {
    duration: number;
    codec?: string;
    bitrate?: number;
    sampleRate?: number;
    channels?: number;
}
export declare class VideoService {
    private readonly logger;
    extractVideoMetadata(filePath: string): Promise<VideoMetadata>;
    extractAudioMetadata(filePath: string): Promise<AudioMetadata>;
    extractAudioFromVideo(videoPath: string, outputDir?: string): Promise<string>;
    generateThumbnail(videoPath: string, timestamp?: number, outputDir?: string): Promise<string>;
    private parseFps;
    isVideoFile(mimetype: string): boolean;
    isAudioFile(mimetype: string): boolean;
}
