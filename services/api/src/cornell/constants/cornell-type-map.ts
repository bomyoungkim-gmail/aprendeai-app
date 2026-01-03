/**
 * Cornell Notes - Type to Color Mapping (Backend)
 *
 * Mirrors frontend mapping to ensure consistency.
 * Used for server-side validation and data processing.
 *
 * @module cornell/constants/cornell-type-map
 */

/**
 * Cornell annotation types
 * Matches frontend HighlightType
 */
export type CornellType =
  | "EVIDENCE"
  | "VOCABULARY"
  | "MAIN_IDEA"
  | "DOUBT"
  | "SYNTHESIS"
  | "AI_RESPONSE";

/**
 * Valid color keys for highlights
 * Matches frontend ColorKey
 */
export type ColorKey =
  | "red"
  | "yellow"
  | "green"
  | "blue"
  | "purple"
  | "pink"
  | "orange";

/**
 * Maps Cornell annotation types to their designated colors
 * MUST match frontend lib/cornell/type-color-map.ts
 */
export const CORNELL_TYPE_COLOR_MAP: Record<
  Exclude<CornellType, "AI_RESPONSE">,
  ColorKey
> = {
  EVIDENCE: "blue",
  VOCABULARY: "blue",
  MAIN_IDEA: "yellow",
  DOUBT: "red",
  SYNTHESIS: "purple",
};

/**
 * Maps Cornell annotation types to semantic tags
 * MUST match frontend lib/cornell/type-color-map.ts
 */
export const CORNELL_TYPE_TAGS: Record<CornellType, string[]> = {
  EVIDENCE: ["evidence"],
  VOCABULARY: ["vocab"],
  MAIN_IDEA: ["main-idea"],
  DOUBT: ["doubt"],
  SYNTHESIS: ["synthesis"],
  AI_RESPONSE: ["ai-response"],
};

/**
 * Get color for a given Cornell type
 */
export function getColorForType(type: CornellType): ColorKey {
  return (
    CORNELL_TYPE_COLOR_MAP[type as Exclude<CornellType, "AI_RESPONSE">] ||
    "blue"
  );
}

/**
 * Get tags for a given Cornell type
 */
export function getTagsForType(type: CornellType): string[] {
  return CORNELL_TYPE_TAGS[type] || [];
}

/**
 * Validate if a type is a valid Cornell type
 */
export function isValidCornellType(type: string): type is CornellType {
  return [
    "EVIDENCE",
    "VOCABULARY",
    "MAIN_IDEA",
    "DOUBT",
    "SYNTHESIS",
    "AI_RESPONSE",
  ].includes(type);
}
