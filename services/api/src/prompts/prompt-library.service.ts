import { Injectable } from "@nestjs/common";
import { CanonicalPrompt, PromptVariables } from "./dto/canonical-prompt.dto";
import { PromptContext } from "./types/prompt-context";
import * as prompts from "./canonical-prompts.json";

@Injectable()
export class PromptLibraryService {
  private readonly prompts: Map<string, CanonicalPrompt>;

  constructor() {
    this.prompts = new Map(
      (prompts as CanonicalPrompt[]).map((p) => [p.key, p]),
    );
  }

  /**
   * Get a prompt by key with optional variable interpolation
   */
  getPrompt(key: string, variables?: PromptVariables): CanonicalPrompt {
    const prompt = this.prompts.get(key);
    if (!prompt) {
      throw new Error(`Prompt not found: ${key}`);
    }

    if (!variables) {
      return prompt;
    }

    return {
      ...prompt,
      nextPrompt: this.interpolate(prompt.nextPrompt, variables),
      quickReplies: prompt.quickReplies.map((reply) =>
        this.interpolate(reply, variables),
      ),
    };
  }

  /**
   * Get prompts filtered by audience
   */
  getPromptsByAudience(audience: "LEARNER" | "EDUCATOR"): CanonicalPrompt[] {
    return Array.from(this.prompts.values()).filter(
      (p) => p.audience === audience,
    );
  }

  /**
   * Get prompts filtered by phase
   */
  getPromptsByPhase(
    phase: "PLAN" | "PRE" | "DURING" | "POST" | "BOOT",
  ): CanonicalPrompt[] {
    return Array.from(this.prompts.values()).filter((p) => p.phase === phase);
  }

  /**
   * Interpolate variables in a prompt using PromptContext
   * This is a convenience wrapper around getPrompt() for dynamic contexts
   */
  interpolateVariables(
    prompt: CanonicalPrompt,
    context: PromptContext,
  ): CanonicalPrompt {
    // Convert PromptContext to PromptVariables (both are Record<string, any>)
    const variables = context as PromptVariables;

    return {
      ...prompt,
      nextPrompt: this.interpolate(prompt.nextPrompt, variables),
      quickReplies: prompt.quickReplies.map((reply) =>
        this.interpolate(reply, variables),
      ),
    };
  }

  /**
   * Template interpolation: replaces {VAR} with values
   */
  private interpolate(template: string, variables: PromptVariables): string {
    return template.replace(/\{(\w+)\}/g, (_, key) => {
      const value = variables[key];
      if (value === undefined) {
        return `{${key}}`; // Keep placeholder if variable not provided
      }
      return String(value);
    });
  }
}
