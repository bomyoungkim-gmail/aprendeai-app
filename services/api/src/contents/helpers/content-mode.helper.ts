import { ContentMode, ContentType } from "@prisma/client";

/**
 * Result of content mode resolution
 */
export interface ModeResolution {
  mode: ContentMode;
  source: "PRODUCER" | "USER" | "HEURISTIC";
  setBy: string; // userId or 'SYSTEM'
  isHeuristic: boolean;
}

/**
 * Content data required for mode resolution
 */
export interface ContentForMode {
  mode?: ContentMode | null;
  modeSource?: string | null;
  modeSetBy?: string | null;
  type: ContentType;
  metadata?: any;
  rawText?: string;
}

/**
 * Helper for resolving Content Mode per Script 02
 *
 * Priority (P1-P3):
 * 1. Explicit DB value (content.mode)
 * 2. UI metadata (uiMode parameter)
 * 3. Heuristic inference from ContentType + metadata
 *
 * Pure domain logic with no framework dependencies.
 */
export class ContentModeHelper {
  /**
   * Resolve content mode with P1-P3 priority logic
   */
  static resolveMode(
    content: ContentForMode,
    uiMode?: string,
    userId?: string,
  ): ModeResolution {
    // P1: DB (Explicit)
    if (content.mode) {
      return {
        mode: content.mode,
        source: (content.modeSource as any) || "PRODUCER",
        setBy: content.modeSetBy || "SYSTEM",
        isHeuristic: false,
      };
    }

    // P2: UI Override
    if (uiMode && this.isValidMode(uiMode)) {
      return {
        mode: uiMode as ContentMode,
        source: "USER",
        setBy: userId || "SYSTEM",
        isHeuristic: false,
      };
    }

    // P3: Heuristic
    const inferredMode = this.inferFromType(content);
    return {
      mode: inferredMode,
      source: "HEURISTIC",
      setBy: "SYSTEM",
      isHeuristic: true,
    };
  }

  /**
   * Infer mode from ContentType with advanced heuristics
   *
   * Per Script 02:
   * - NEWS → NEWS
   * - ARXIV → SCIENTIFIC
   * - SCHOOL_MATERIAL → DIDACTIC
   * - ARTICLE/WEB_CLIP → TECHNICAL (default) with narrative override
   * - TEXT → TECHNICAL (default) with narrative override
   * - VIDEO/AUDIO → inherit from transcript/description, else TECHNICAL
   */
  static inferFromType(content: ContentForMode): ContentMode {
    switch (content.type) {
      case "NEWS":
        return "NEWS";

      case "ARXIV":
        return "SCIENTIFIC";

      case "SCHOOL_MATERIAL":
        return "DIDACTIC";

      case "ARTICLE":
      case "WEB_CLIP":
        // Check for narrative patterns
        if (this.isNarrativeContent(content)) {
          return "NARRATIVE";
        }
        return "TECHNICAL";

      case "TEXT":
        // Check for narrative patterns
        if (this.isNarrativeContent(content)) {
          return "NARRATIVE";
        }
        return "TECHNICAL";

      case "VIDEO":
      case "AUDIO":
        // Try to inherit from transcript/description metadata
        const inheritedMode = this.inheritModeFromMedia(content);
        return inheritedMode || "TECHNICAL";

      default:
        return "TECHNICAL";
    }
  }

  /**
   * Detect if content is narrative (fiction, story, etc.)
   *
   * Heuristics:
   * - Check metadata.genre for 'fiction', 'novel', 'story'
   * - Check for dialogue patterns in text (quotation marks)
   * - Check for narrative keywords
   */
  private static isNarrativeContent(content: ContentForMode): boolean {
    // Check metadata genre
    const genre = content.metadata?.genre?.toLowerCase();
    if (
      genre &&
      [
        "fiction",
        "novel",
        "story",
        "narrative",
        "romance",
        "ficção",
        "conto",
      ].some((g) => genre.includes(g))
    ) {
      return true;
    }

    // Check text patterns (if available and not too long)
    if (content.rawText && content.rawText.length < 5000) {
      const text = content.rawText.toLowerCase();

      // High quotation mark density suggests dialogue
      const quoteCount = (text.match(/["']/g) || []).length;
      if (quoteCount > text.length / 100) {
        // > 1% quotation marks
        return true;
      }

      // Narrative keywords
      const narrativeKeywords = [
        "capítulo",
        "personagem",
        "protagonista",
        "enredo",
      ];
      if (narrativeKeywords.some((kw) => text.includes(kw))) {
        return true;
      }
    }

    return false;
  }

  /**
   * Inherit mode from VIDEO/AUDIO transcript or description
   */
  private static inheritModeFromMedia(
    content: ContentForMode,
  ): ContentMode | null {
    // Check if metadata has a mode hint
    const metadataMode =
      content.metadata?.contentMode || content.metadata?.mode;
    if (metadataMode && this.isValidMode(metadataMode)) {
      return metadataMode as ContentMode;
    }

    // Check transcript/description for patterns
    const description =
      content.metadata?.description || content.metadata?.transcript;
    if (description) {
      const descLower = description.toLowerCase();

      // Didactic patterns
      if (/aula|didático|educacional|tutorial|curso/i.test(descLower)) {
        return "DIDACTIC";
      }

      // News patterns
      if (/notícia|reportagem|jornalismo|entrevista/i.test(descLower)) {
        return "NEWS";
      }

      // Scientific patterns
      if (/pesquisa|estudo|científico|experimento/i.test(descLower)) {
        return "SCIENTIFIC";
      }
    }

    return null; // No inheritance possible
  }

  /**
   * Validate if string is a valid ContentMode
   */
  private static isValidMode(mode: string): boolean {
    return [
      "NARRATIVE",
      "DIDACTIC",
      "TECHNICAL",
      "NEWS",
      "SCIENTIFIC",
      "LANGUAGE",
    ].includes(mode);
  }
}
