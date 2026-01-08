import { Injectable, Logger } from '@nestjs/common';
import { ContentMode } from '@prisma/client';
import {
  ScaffoldingLevel,
  ScaffoldingInitParams,
  LearnerProfileForScaffolding,
} from '../domain/scaffolding.types';

/**
 * Serviço responsável por determinar o nível inicial de scaffolding
 * baseado em ContentMode e perfil do aluno.
 *
 * SCRIPT 03 - Fase 1: Mode-Aware Initialization
 * GAP 6: Respeita policy override quando fornecido.
 *
 * @see scaffolding_fading_plan.md - Fase 1.1
 */
@Injectable()
export class ScaffoldingInitializerService {
  private readonly logger = new Logger(ScaffoldingInitializerService.name);

  /**
   * Determina o nível inicial de scaffolding.
   *
   * Lógica mode-aware:
   * - DIDACTIC: L2 ou L3 (iniciante)
   * - NARRATIVE: L0 ou L1 (permite L0 facilmente)
   * - TECHNICAL/SCIENTIFIC: L1 ou L2
   * - NEWS: L1 ou L2 (baseado em performance recente)
   *
   * @param params - Parâmetros de inicialização
   * @returns Nível de scaffolding (0-3)
   */
  getInitialLevel(params: ScaffoldingInitParams): ScaffoldingLevel {
    const { mode, learnerProfile, policyOverride } = params;

    // GAP 6: Respeitar policy override
    if (policyOverride !== undefined && this.isValidLevel(policyOverride)) {
      this.logger.log(
        `Using policy override: L${policyOverride} for mode ${mode}`
      );
      return policyOverride as ScaffoldingLevel;
    }

    // Lógica mode-aware
    const level = this.calculateInitialLevel(mode, learnerProfile);
    
    this.logger.debug(
      `Calculated initial level L${level} for mode ${mode} (isNew: ${learnerProfile.isNewUser}, avgMastery: ${learnerProfile.avgMastery.toFixed(2)})`
    );
    
    return level;
  }

  /**
   * Calcula nível inicial baseado em mode e perfil.
   *
   * @private
   */
  private calculateInitialLevel(
    mode: ContentMode,
    profile: LearnerProfileForScaffolding
  ): ScaffoldingLevel {
    switch (mode) {
      case ContentMode.DIDACTIC:
        // DIDACTIC: L2 ou L3 (iniciante)
        // Alunos novos ou com baixa maestria precisam de mais suporte
        return profile.isNewUser || profile.avgMastery < 0.4 ? 3 : 2;

      case ContentMode.NARRATIVE:
        // NARRATIVE: L1 (permite L0 facilmente)
        // Material narrativo é mais acessível, permite menos scaffolding
        return profile.avgMastery > 0.7 ? 0 : 1;

      case ContentMode.TECHNICAL:
      case ContentMode.SCIENTIFIC:
        // TECHNICAL/SCIENTIFIC: L1 ou L2
        // Material técnico requer suporte moderado
        return profile.avgMastery > 0.6 ? 1 : 2;

      case ContentMode.NEWS:
        // NEWS: L1 ou L2 (baseado em performance recente)
        // Notícias variam em complexidade, usar performance recente
        return profile.recentPerformance > 0.7 ? 1 : 2;

      default:
        // Fallback: L2 (moderado)
        this.logger.warn(`Unknown ContentMode: ${mode}, defaulting to L2`);
        return 2;
    }
  }

  /**
   * Valida se o nível está no range válido (0-3).
   *
   * @private
   */
  private isValidLevel(level: number): boolean {
    return Number.isInteger(level) && level >= 0 && level <= 3;
  }
}
