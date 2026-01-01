import { ContentMode } from '../types/content-mode';
import type { ModeConfig } from '../config/mode-config';

/**
 * ConfusionDetector
 * 
 * Heurística para detectar confusão ou dificuldade do usuário.
 * Identifica padrões como:
 * - Scroll Bursts (scroll rápido e desorientado)
 * - Zoom Loops (alterações frequentes de zoom)
 * - Section Rereads (voltar repetidamente para a mesma seção)
 */
export class ConfusionDetector {
  private scrollBursts: number = 0;
  private zoomChanges: number = 0;
  private rereadSections: Map<string, number> = new Map();
  private lastResetTime: number = Date.now();
  private readonly RESET_WINDOW_MS = 300000; // 5 minutos para limpar métricas antigas

  constructor(private config: ModeConfig, private mode: ContentMode) {}

  /**
   * Registra um evento de "scroll rápido" detectado pela UI
   */
  recordScrollBurst(): void {
    this.checkWindowReset();
    this.scrollBursts++;
  }

  /**
   * Registra uma mudança de zoom
   */
  recordZoomChange(): void {
    this.checkWindowReset();
    this.zoomChanges++;
  }

  /**
   * Registra que o usuário entrou/viu uma seção
   * @param sectionId Identificador único da seção/página
   */
  recordSectionVisit(sectionId: string): void {
    this.checkWindowReset();
    const views = this.rereadSections.get(sectionId) || 0;
    this.rereadSections.set(sectionId, views + 1);
  }

  /**
   * Determina se o usuário demonstra sinais de confusão
   */
  isConfused(): boolean {
    const maxRereads = Math.max(0, ...Array.from(this.rereadSections.values()));

    // F2.2: Em modo TECHNICAL, navegação não-linear é esperada e encorajada.
    // Aplicamos thresholds mais altos.
    if (this.mode === ContentMode.TECHNICAL) {
      return (
        this.scrollBursts > this.config.confusionScrollBurstThreshold * 2 ||
        this.zoomChanges > this.config.confusionZoomRepeatThreshold * 2 ||
        maxRereads > this.config.confusionRereadThreshold * 2
      );
    }

    // Comportamento padrão para outros modos
    return (
      this.scrollBursts > this.config.confusionScrollBurstThreshold ||
      this.zoomChanges > this.config.confusionZoomRepeatThreshold ||
      maxRereads > this.config.confusionRereadThreshold
    );
  }

  /**
   * Getters para telemetria/debugging
   */
  getMetrics() {
    return {
      scrollBursts: this.scrollBursts,
      zoomChanges: this.zoomChanges,
      maxRereads: Math.max(0, ...Array.from(this.rereadSections.values())),
      thresholds: {
        burst: this.config.confusionScrollBurstThreshold,
        zoom: this.config.confusionZoomRepeatThreshold,
        reread: this.config.confusionRereadThreshold
      }
    };
  }

  private checkWindowReset(): void {
    const now = Date.now();
    if (now - this.lastResetTime > this.RESET_WINDOW_MS) {
      this.scrollBursts = 0;
      this.zoomChanges = 0;
      this.rereadSections.clear();
      this.lastResetTime = now;
    }
  }

  updateConfig(config: ModeConfig, mode: ContentMode): void {
    this.config = config;
    this.mode = mode;
  }
}
