import { SessionEvent } from "../domain/reading-session.entity";

export interface ExtractedVocab {
  word: string;
  context: string;
  sourceEventId: string;
}

/**
 * Extract vocabulary from session events
 * Looks for MARK_UNKNOWN_WORD events and extracts word + context
 */
export function extractVocabFromEvents(
  events: SessionEvent[] | any[],
): ExtractedVocab[] {
  return events
    .filter(
      (e) =>
        e.eventType === "MARK_UNKNOWN_WORD" ||
        e.event_type === "MARK_UNKNOWN_WORD",
    )
    .map((e) => {
      const payload = e.payload_json || e.payload || {};
      return {
        word: payload.word || payload.text || "",
        context: payload.context || payload.sentence || "",
        sourceEventId: e.id,
      };
    })
    .filter((v) => v.word.length > 0); // Filter out empty words
}
