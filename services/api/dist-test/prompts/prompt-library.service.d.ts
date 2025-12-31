import { CanonicalPrompt, PromptVariables } from "./dto/canonical-prompt.dto";
export declare class PromptLibraryService {
    private readonly prompts;
    constructor();
    getPrompt(key: string, variables?: PromptVariables): CanonicalPrompt;
    getPromptsByAudience(audience: "LEARNER" | "EDUCATOR"): CanonicalPrompt[];
    getPromptsByPhase(phase: "PLAN" | "PRE" | "DURING" | "POST" | "BOOT"): CanonicalPrompt[];
    private interpolate;
}
