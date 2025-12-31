"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var VideoService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.VideoService = void 0;
const common_1 = require("@nestjs/common");
const ffmpeg = require("fluent-ffmpeg");
const util_1 = require("util");
const fs = require("fs");
const path = require("path");
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
ffmpeg.setFfmpegPath(ffmpegPath);
const ffprobe = (0, util_1.promisify)(ffmpeg.ffprobe);
const unlink = (0, util_1.promisify)(fs.unlink);
let VideoService = VideoService_1 = class VideoService {
    constructor() {
        this.logger = new common_1.Logger(VideoService_1.name);
    }
    async extractVideoMetadata(filePath) {
        try {
            const metadata = await ffprobe(filePath);
            const videoStream = metadata.streams.find((s) => s.codec_type === "video");
            const audioStream = metadata.streams.find((s) => s.codec_type === "audio");
            return {
                duration: metadata.format.duration || 0,
                width: videoStream === null || videoStream === void 0 ? void 0 : videoStream.width,
                height: videoStream === null || videoStream === void 0 ? void 0 : videoStream.height,
                codec: videoStream === null || videoStream === void 0 ? void 0 : videoStream.codec_name,
                bitrate: metadata.format.bit_rate
                    ? parseInt(metadata.format.bit_rate.toString())
                    : undefined,
                hasAudio: !!audioStream,
                fps: (videoStream === null || videoStream === void 0 ? void 0 : videoStream.r_frame_rate)
                    ? this.parseFps(videoStream.r_frame_rate)
                    : undefined,
            };
        }
        catch (error) {
            this.logger.error(`Failed to extract video metadata: ${error.message}`);
            throw error;
        }
    }
    async extractAudioMetadata(filePath) {
        try {
            const metadata = await ffprobe(filePath);
            const audioStream = metadata.streams.find((s) => s.codec_type === "audio");
            return {
                duration: metadata.format.duration || 0,
                codec: audioStream === null || audioStream === void 0 ? void 0 : audioStream.codec_name,
                bitrate: (audioStream === null || audioStream === void 0 ? void 0 : audioStream.bit_rate)
                    ? parseInt(audioStream.bit_rate.toString())
                    : undefined,
                sampleRate: (audioStream === null || audioStream === void 0 ? void 0 : audioStream.sample_rate)
                    ? parseInt(audioStream.sample_rate.toString())
                    : undefined,
                channels: audioStream === null || audioStream === void 0 ? void 0 : audioStream.channels,
            };
        }
        catch (error) {
            this.logger.error(`Failed to extract audio metadata: ${error.message}`);
            throw error;
        }
    }
    async extractAudioFromVideo(videoPath, outputDir = "./uploads/temp") {
        try {
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }
            const filename = path.basename(videoPath, path.extname(videoPath));
            const outputPath = path.join(outputDir, `${filename}_audio.mp3`);
            await new Promise((resolve, reject) => {
                ffmpeg(videoPath)
                    .output(outputPath)
                    .audioCodec("libmp3lame")
                    .audioBitrate("128k")
                    .noVideo()
                    .on("end", () => resolve())
                    .on("error", (err) => reject(err))
                    .run();
            });
            return outputPath;
        }
        catch (error) {
            this.logger.error(`Failed to extract audio: ${error.message}`);
            throw error;
        }
    }
    async generateThumbnail(videoPath, timestamp = 1, outputDir = "./uploads/thumbnails") {
        try {
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }
            const filename = path.basename(videoPath, path.extname(videoPath));
            const outputPath = path.join(outputDir, `${filename}_thumbnail.jpg`);
            await new Promise((resolve, reject) => {
                ffmpeg(videoPath)
                    .screenshots({
                    timestamps: [timestamp],
                    filename: path.basename(outputPath),
                    folder: outputDir,
                    size: "640x360",
                })
                    .on("end", () => resolve())
                    .on("error", (err) => reject(err));
            });
            return outputPath;
        }
        catch (error) {
            this.logger.error(`Failed to generate thumbnail: ${error.message}`);
            throw error;
        }
    }
    parseFps(fpsString) {
        if (typeof fpsString === "number")
            return fpsString;
        const [num, den] = fpsString.split("/").map(Number);
        return den ? num / den : num;
    }
    isVideoFile(mimetype) {
        return mimetype.startsWith("video/");
    }
    isAudioFile(mimetype) {
        return mimetype.startsWith("audio/");
    }
};
exports.VideoService = VideoService;
exports.VideoService = VideoService = VideoService_1 = __decorate([
    (0, common_1.Injectable)()
], VideoService);
//# sourceMappingURL=video.service.js.map