import { Injectable, Logger } from '@nestjs/common';
import * as ffmpeg from 'fluent-ffmpeg';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

// Set ffmpeg path
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
ffmpeg.setFfmpegPath(ffmpegPath);

const ffprobe = promisify(ffmpeg.ffprobe);
const unlink = promisify(fs.unlink);

export interface VideoMetadata {
  duration: number;        // In seconds
  width?: number;
  height?: number;
  codec?: string;
  bitrate?: number;
  hasAudio: boolean;
  fps?: number;
}

export interface AudioMetadata {
  duration: number;        // In seconds
  codec?: string;
  bitrate?: number;
  sampleRate?: number;
  channels?: number;
}

@Injectable()
export class VideoService {
  private readonly logger = new Logger(VideoService.name);

  /**
   * Extract metadata from video file
   */
  async extractVideoMetadata(filePath: string): Promise<VideoMetadata> {
    try {
      const metadata: any = await ffprobe(filePath);

      const videoStream = metadata.streams.find((s: any) => s.codec_type === 'video');
      const audioStream = metadata.streams.find((s: any) => s.codec_type === 'audio');

      return {
        duration: metadata.format.duration || 0,
        width: videoStream?.width,
        height: videoStream?.height,
        codec: videoStream?.codec_name,
        bitrate: metadata.format.bit_rate ? parseInt(metadata.format.bit_rate.toString()) : undefined,
        hasAudio: !!audioStream,
        fps: videoStream?.r_frame_rate ? this.parseFps(videoStream.r_frame_rate) : undefined,
      };
    } catch (error) {
      this.logger.error(`Failed to extract video metadata: ${error.message}`);
      throw error;
    }
  }

  /**
   * Extract metadata from audio file
   */
  async extractAudioMetadata(filePath: string): Promise<AudioMetadata> {
    try {
      const metadata: any = await ffprobe(filePath);

      const audioStream = metadata.streams.find((s: any) => s.codec_type === 'audio');

      return {
        duration: metadata.format.duration || 0,
        codec: audioStream?.codec_name,
        bitrate: audioStream?.bit_rate ? parseInt(audioStream.bit_rate.toString()) : undefined,
        sampleRate: audioStream?.sample_rate ? parseInt(audioStream.sample_rate.toString()) : undefined,
        channels: audioStream?.channels,
      };
    } catch (error) {
      this.logger.error(`Failed to extract audio metadata: ${error.message}`);
      throw error;
    }
  }

  /**
   * Extract audio track from video file for transcription
   */
  async extractAudioFromVideo(videoPath: string, outputDir: string = './uploads/temp'): Promise<string> {
    try {
      // Ensure output directory exists
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const filename = path.basename(videoPath, path.extname(videoPath));
      const outputPath = path.join(outputDir, `${filename}_audio.mp3`);

      await new Promise<void>((resolve, reject) => {
        ffmpeg(videoPath)
          .output(outputPath)
          .audioCodec('libmp3lame')
          .audioBitrate('128k')
          .noVideo()
          .on('end', () => resolve())
          .on('error', (err) => reject(err))
          .run();
      });

      return outputPath;
    } catch (error) {
      this.logger.error(`Failed to extract audio: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate thumbnail from video
   */
  async generateThumbnail(
    videoPath: string, 
    timestamp: number = 1, // 1 second into video
    outputDir: string = './uploads/thumbnails'
  ): Promise<string> {
    try {
      // Ensure output directory exists
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const filename = path.basename(videoPath, path.extname(videoPath));
      const outputPath = path.join(outputDir, `${filename}_thumbnail.jpg`);

      await new Promise<void>((resolve, reject) => {
        ffmpeg(videoPath)
          .screenshots({
            timestamps: [timestamp],
            filename: path.basename(outputPath),
            folder: outputDir,
            size: '640x360'
          })
          .on('end', () => resolve())
          .on('error', (err) => reject(err));
      });

      return outputPath;
    } catch (error) {
      this.logger.error(`Failed to generate thumbnail: ${error.message}`);
      throw error;
    }
  }

  /**
   * Parse FPS from ffprobe format (e.g., "30000/1001" -> 29.97)
   */
  private parseFps(fpsString: string | number): number {
    if (typeof fpsString === 'number') return fpsString;
    
    const [num, den] = fpsString.split('/').map(Number);
    return den ? num / den : num;
  }

  /**
   * Check if file is video
   */
  isVideoFile(mimetype: string): boolean {
    return mimetype.startsWith('video/');
  }

  /**
   * Check if file is audio
   */
  isAudioFile(mimetype: string): boolean {
    return mimetype.startsWith('audio/');
  }
}
