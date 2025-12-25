export interface CanonicalPrompt {
  key: string;
  audience: "LEARNER" | "EDUCATOR";
  phase: "PLAN" | "PRE" | "DURING" | "POST" | "BOOT";
  nextPrompt: string;
  quickReplies: string[];
  notes?: string;
}

export interface PromptVariables {
  [key: string]: string | number | boolean;
}
