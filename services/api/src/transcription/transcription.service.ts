import { Injectable, Logger } from "@nestjs/common";
import OpenAI from "openai";
import * as fs from "fs";

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

@Injectable()
export class TranscriptionService {
  private readonly logger = new Logger(TranscriptionService.name);
  private openai: OpenAI;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      this.logger.warn(
        "OPENAI_API_KEY not configured. Transcription will be unavailable.",
      );
    } else {
      this.openai = new OpenAI({ apiKey });
    }
  }

  /**
   * Transcribe audio/video file using OpenAI Whisper
   */
  async transcribe(filePath: string): Promise<Transcription> {
    if (!this.openai) {
      throw new Error("OpenAI API key not configured");
    }

    try {
      this.logger.log(`Starting transcription for: ${filePath}`);

      const fileStream = fs.createReadStream(filePath);

      const response = await this.openai.audio.transcriptions.create({
        file: fileStream,
        model: "whisper-1",
        response_format: "verbose_json",
        timestamp_granularities: ["word", "segment"],
      });

      this.logger.log(
        `Transcription completed. Language: ${response.language}`,
      );

      return {
        text: response.text,
        language: response.language,
        duration: response.duration,
        segments: response.segments as TranscriptionSegment[],
        words: response.words as TranscriptionWord[],
      };
    } catch (error) {
      this.logger.error(`Transcription failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Generate WebVTT subtitle file from transcription
   */
  generateWebVTT(transcription: Transcription): string {
    let vtt = "WEBVTT\n\n";

    transcription.segments.forEach((segment, index) => {
      const startTime = this.formatTime(segment.start);
      const endTime = this.formatTime(segment.end);

      vtt += `${index + 1}\n`;
      vtt += `${startTime} --> ${endTime}\n`;
      vtt += `${segment.text.trim()}\n\n`;
    });

    return vtt;
  }

  /**
   * Format seconds to WebVTT timestamp (HH:MM:SS.mmm)
   */
  private formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const millis = Math.floor((seconds % 1) * 1000);

    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}.${millis
      .toString()
      .padStart(3, "0")}`;
  }

  /**
   * Check if API is available
   */
  isAvailable(): boolean {
    return !!this.openai;
  }
}
