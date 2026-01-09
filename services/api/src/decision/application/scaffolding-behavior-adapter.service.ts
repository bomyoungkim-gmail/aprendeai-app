import { Injectable, Logger } from '@nestjs/common';
import { ContentMode } from '@prisma/client';
import { ScaffoldingLevel } from '../domain/scaffolding.types';

/**
 * SCRIPT 03 - Fase 3: Behavior Modifiers
 * 
 * GAP 1: Phase-aware behavior modifiers
 */
export interface BehaviorModifiers {
  /** Response format (STEP_BY_STEP, DIRECT_WITH_VERIFICATION, DIRECT, MINIMAL) */
  responseFormat: 'STEP_BY_STEP' | 'DIRECT_WITH_VERIFICATION' | 'DIRECT' | 'MINIMAL';
  
  /** Whether to use Socratic questioning (DIDACTIC L3 only) */
  useSocraticMode: boolean;
  
  /** Whether to include examples in responses */
  includeExamples: boolean;
  
  /** Whether to include verification questions */
  includeVerification: boolean;
  
  /** Quick reply suggestions for user */
  quickReplies: string[];
  
  /** Tone adjustment (formal, conversational, minimal) */
  tone: 'formal' | 'conversational' | 'minimal';
  
  /** GAP 1: Phase-specific adjustments */
  phaseAdjustments: {
    /** During reading: more concise, less interruption */
    duringReading: boolean;
    
    /** Post-reading: more detailed, comprehensive */
    postReading: boolean;
  };
}

/**
 * SCRIPT 03 - Fase 3: Scaffolding Behavior Adapter Service
 * 
 * Adapts AI behavior based on:
 * - Content mode (DIDACTIC, NARRATIVE, TECHNICAL, etc.)
 * - Scaffolding level (L0-L3)
 * - Session phase (DURING, POST)
 * 
 * GAP 1: Phase-aware behavior
 * GAP 2: L3 step-by-step format
 * GAP 7: L1 quick replies
 */
@Injectable()
export class ScaffoldingBehaviorAdapterService {
  private readonly logger = new Logger(ScaffoldingBehaviorAdapterService.name);

  /**
   * Get behavior modifiers based on mode, level, and phase
   * 
   * GAP 1: Phase-aware behavior modifiers
   */
  getBehaviorModifiers(
    mode: ContentMode,
    level: ScaffoldingLevel,
    phase: 'DURING' | 'POST',
  ): BehaviorModifiers {
    // Base modifiers by level
    const baseModifiers = this.getBaseModifiersByLevel(level);
    
    // Apply mode-specific adjustments
    const modeAdjusted = this.applyModeAdjustments(baseModifiers, mode, level);
    
    // Apply phase-specific adjustments (GAP 1)
    const phaseAdjusted = this.applyPhaseAdjustments(modeAdjusted, phase);
    
    return phaseAdjusted;
  }

  /**
   * Get base behavior modifiers by scaffolding level
   */
  private getBaseModifiersByLevel(level: ScaffoldingLevel): BehaviorModifiers {
    switch (level) {
      case 3: // High scaffolding
        return {
          responseFormat: 'STEP_BY_STEP',
          useSocraticMode: false, // Will be enabled for DIDACTIC
          includeExamples: true,
          includeVerification: true,
          quickReplies: [],
          tone: 'conversational',
          phaseAdjustments: {
            duringReading: false,
            postReading: false,
          },
        };

      case 2: // Medium scaffolding
        return {
          responseFormat: 'DIRECT_WITH_VERIFICATION',
          useSocraticMode: false,
          includeExamples: true,
          includeVerification: true,
          quickReplies: [],
          tone: 'conversational',
          phaseAdjustments: {
            duringReading: false,
            postReading: false,
          },
        };

      case 1: // Low scaffolding
        return {
          responseFormat: 'DIRECT',
          useSocraticMode: false,
          includeExamples: false,
          includeVerification: false,
          quickReplies: [
            'Explicar mais',
            'Dar exemplo',
            'Relacionar conceitos',
          ], // GAP 7
          tone: 'conversational',
          phaseAdjustments: {
            duringReading: false,
            postReading: false,
          },
        };

      case 0: // Minimal/Faded
        return {
          responseFormat: 'MINIMAL',
          useSocraticMode: false,
          includeExamples: false,
          includeVerification: false,
          quickReplies: [],
          tone: 'minimal',
          phaseAdjustments: {
            duringReading: false,
            postReading: false,
          },
        };

      default:
        return this.getBaseModifiersByLevel(2); // Default to L2
    }
  }

  /**
   * Apply mode-specific adjustments
   */
  private applyModeAdjustments(
    modifiers: BehaviorModifiers,
    mode: ContentMode,
    level: ScaffoldingLevel,
  ): BehaviorModifiers {
    const adjusted = { ...modifiers };

    switch (mode) {
      case ContentMode.DIDACTIC:
        // Enable Socratic mode for L3
        if (level === 3) {
          adjusted.useSocraticMode = true;
          adjusted.tone = 'formal';
        }
        break;

      case ContentMode.NARRATIVE:
        // More conversational, less formal
        adjusted.tone = 'conversational';
        // Fading is easier in NARRATIVE
        if (level === 1) {
          adjusted.responseFormat = 'MINIMAL';
        }
        break;

      case ContentMode.TECHNICAL:
      case ContentMode.SCIENTIFIC:
        // More formal, precise language
        adjusted.tone = 'formal';
        // Always include examples for complex content
        adjusted.includeExamples = true;
        break;

      case ContentMode.NEWS:
        // Conversational, context-focused
        adjusted.tone = 'conversational';
        break;

      case 'GAME' as ContentMode:
        // AC6: GAME mode - minimal intervention always
        // Don't interrupt game flow with scaffolding
        adjusted.responseFormat = 'MINIMAL';
        adjusted.useSocraticMode = false;
        adjusted.includeExamples = false;
        adjusted.includeVerification = false;
        adjusted.quickReplies = [];
        adjusted.tone = 'minimal';
        break;

      default:
        // Keep defaults
        break;
    }

    return adjusted;
  }

  /**
   * Apply phase-specific adjustments
   * 
   * GAP 1: Phase-aware behavior
   */
  private applyPhaseAdjustments(
    modifiers: BehaviorModifiers,
    phase: 'DURING' | 'POST',
  ): BehaviorModifiers {
    const adjusted = { ...modifiers };

    if (phase === 'DURING') {
      // During reading: be more concise, less interruption
      adjusted.phaseAdjustments.duringReading = true;
      
      // Reduce verbosity for DURING phase
      if (adjusted.responseFormat === 'STEP_BY_STEP') {
        // Keep step-by-step but make steps more concise
        adjusted.includeExamples = false; // Save examples for POST
      }
      
      // Shorter quick replies
      if (adjusted.quickReplies.length > 0) {
        adjusted.quickReplies = adjusted.quickReplies.slice(0, 3);
      }
    } else {
      // Post-reading: more detailed, comprehensive
      adjusted.phaseAdjustments.postReading = true;
      
      // Can be more verbose in POST phase
      if (adjusted.responseFormat === 'DIRECT') {
        adjusted.includeVerification = true; // Add verification in POST
      }
    }

    return adjusted;
  }

  /**
   * Format system prompt with scaffolding behavior
   * 
   * GAP 2: L3 step-by-step format with 4 detailed steps + example
   * GAP 7: L1 quick replies template
   */
  formatSystemPrompt(
    basePrompt: string,
    modifiers: BehaviorModifiers,
    mode: ContentMode,
  ): string {
    let enhancedPrompt = basePrompt;

    // Add response format instructions
    enhancedPrompt += '\n\n## Response Format\n';
    enhancedPrompt += this.getResponseFormatInstructions(modifiers);

    // Add tone instructions
    enhancedPrompt += '\n\n## Tone\n';
    enhancedPrompt += this.getToneInstructions(modifiers.tone);

    // Add Socratic mode instructions (DIDACTIC L3)
    if (modifiers.useSocraticMode) {
      enhancedPrompt += '\n\n## Socratic Method\n';
      enhancedPrompt += this.getSocraticInstructions();
    }

    // Add quick replies template (GAP 7)
    if (modifiers.quickReplies.length > 0) {
      enhancedPrompt += '\n\n## Quick Reply Suggestions\n';
      enhancedPrompt += `Always end your response with these quick reply options: ${modifiers.quickReplies.join(', ')}`;
    }

    // Add phase-specific instructions (GAP 1)
    if (modifiers.phaseAdjustments.duringReading) {
      enhancedPrompt += '\n\n## During Reading Phase\n';
      enhancedPrompt += 'Keep responses concise and focused. Avoid lengthy explanations that interrupt reading flow.';
    } else if (modifiers.phaseAdjustments.postReading) {
      enhancedPrompt += '\n\n## Post-Reading Phase\n';
      enhancedPrompt += 'Provide comprehensive, detailed responses. This is the time for deeper exploration.';
    }

    return enhancedPrompt;
  }

  /**
   * Get response format instructions
   * 
   * GAP 2: L3 step-by-step format with 4 detailed steps + example
   */
  private getResponseFormatInstructions(modifiers: BehaviorModifiers): string {
    switch (modifiers.responseFormat) {
      case 'STEP_BY_STEP':
        // GAP 2: L3 detailed step-by-step format
        return `Use a step-by-step format with 4 detailed steps:

1. **Identificação**: Identifique o conceito ou problema principal
2. **Análise**: Analise os componentes e relações
3. **Aplicação**: Mostre como aplicar o conhecimento
4. **Verificação**: Inclua uma pergunta de verificação

${modifiers.includeExamples ? '**Exemplo Prático**: Sempre inclua um exemplo concreto após os 4 passos.' : ''}`;

      case 'DIRECT_WITH_VERIFICATION':
        return `Provide a direct answer followed by a verification question.

Format:
- Clear, direct response
- ${modifiers.includeExamples ? 'Include a relevant example' : ''}
- End with: "Para verificar: [verification question]"`;

      case 'DIRECT':
        return `Provide a clear, direct answer.
${modifiers.includeExamples ? '- Include examples when helpful' : ''}
${modifiers.includeVerification ? '- End with a brief verification question' : ''}`;

      case 'MINIMAL':
        return 'Provide concise, essential information only. No elaboration unless explicitly requested.';

      default:
        return 'Provide a helpful, clear response.';
    }
  }

  /**
   * Get tone instructions
   */
  private getToneInstructions(tone: 'formal' | 'conversational' | 'minimal'): string {
    switch (tone) {
      case 'formal':
        return 'Use formal, academic language. Be precise and technical.';
      case 'conversational':
        return 'Use friendly, conversational language. Be approachable and engaging.';
      case 'minimal':
        return 'Use minimal, direct language. Be brief and to the point.';
      default:
        return 'Use clear, appropriate language.';
    }
  }

  /**
   * Get Socratic method instructions (DIDACTIC L3)
   */
  private getSocraticInstructions(): string {
    return `Use the Socratic method:
- Ask guiding questions rather than giving direct answers
- Help the learner discover concepts through inquiry
- Build on their responses to deepen understanding
- Use "What do you think..." and "Why might..." questions`;
  }
}
