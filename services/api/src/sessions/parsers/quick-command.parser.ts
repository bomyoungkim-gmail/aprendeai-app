import { Injectable } from "@nestjs/common";
import { PromptMetadataDto } from "../dto/prompt-message.dto";

export interface ParsedEvent {
  eventType: string;
  payloadJson: any;
}

@Injectable()
export class QuickCommandParser {
  /**
   * Parses quick commands from prompt text
   * Returns array of SessionEvents to persist
   */
  parse(text: string, metadata: PromptMetadataDto): ParsedEvent[] {
    const trimmed = text.trim();
    const events: ParsedEvent[] = [];

    // /mark unknown: word1, word2, word3
    if (trimmed.startsWith("/mark unknown:")) {
      const wordsText = trimmed.substring("/mark unknown:".length).trim();
      const words = wordsText
        .split(",")
        .map((w) => w.trim())
        .filter((w) => w);

      for (const word of words) {
        events.push({
          eventType: "MARK_UNKNOWN_WORD",
          payloadJson: {
            word,
            language: this.inferLanguage(word), // Simple heuristic for now
            origin: "READ",
            blockId: metadata.blockId,
            chunkId: metadata.chunkId,
          },
        });
      }
      return events;
    }

    // /keyidea: text
    if (trimmed.startsWith("/keyidea:")) {
      const excerpt = trimmed.substring("/keyidea:".length).trim();
      events.push({
        eventType: "MARK_KEY_IDEA",
        payloadJson: {
          blockId: metadata.blockId || "unknown",
          excerpt,
        },
      });
      return events;
    }

    // /checkpoint: answer text
    if (trimmed.startsWith("/checkpoint:")) {
      const answer = trimmed.substring("/checkpoint:".length).trim();
      events.push({
        eventType: "CHECKPOINT_RESPONSE",
        payloadJson: {
          blockId: metadata.blockId || "unknown",
          questionId: "generated", // Will be enriched by context
          answerText: answer,
        },
      });
      return events;
    }

    // /production TYPE: text
    const productionMatch = trimmed.match(
      /^\/production\s+(FREE_RECALL|SENTENCES|ORAL|OPEN_DIALOGUE):\s*(.+)$/i,
    );
    if (productionMatch) {
      const [, type, text] = productionMatch;
      events.push({
        eventType: "PRODUCTION_SUBMIT",
        payloadJson: {
          type: type as "FREE_RECALL" | "SENTENCES" | "ORAL" | "OPEN_DIALOGUE",
          text: text.trim(),
        },
      });
      return events;
    }

    // No quick command found
    return events;
  }

  /**
   * Simple language inference heuristic
   * Returns 'PT' by default, can be enhanced later
   */
  private inferLanguage(word: string): "PT" | "EN" | "KO" {
    // Korean detection (Hangul range)
    if (/[\uac00-\ud7af]/.test(word)) {
      return "KO";
    }

    // English detection (simple heuristic: common English words or mostly ASCII)
    const commonEnglish = [
      "the",
      "is",
      "are",
      "was",
      "were",
      "have",
      "has",
      "had",
      "do",
      "does",
      "did",
    ];
    if (
      commonEnglish.includes(word.toLowerCase()) ||
      /^[a-z]+$/.test(word.toLowerCase())
    ) {
      return "EN";
    }

    // Default to Portuguese
    return "PT";
  }
}
