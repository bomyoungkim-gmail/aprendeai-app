import type { ModeConfig } from '../config/mode-config';

/**
 * FlowDetector
 * 
 * Heurística para detectar o estado de "Flow" (foco profundo) do usuário.
 * Baseia-se na estabilidade do tempo de permanência (dwell time) em seções
 * e na baixa frequência de interações com a interface.
 */
export class FlowDetector {
  private dwellTimes: number[] = [];
  private uiToggles: number = 0;
  private lastToggleTime: number = 0;
  private readonly MAX_HISTORY = 10;
  private readonly TOGGLE_WINDOW_MS = 60000; // 1 minuto

  constructor(private config: ModeConfig) {}

  /**
   * Registra um novo tempo de permanência observado
   * @param ms Tempo em milissegundos
   */
  addDwellTime(ms: number): void {
    this.dwellTimes.push(ms);
    if (this.dwellTimes.length > this.MAX_HISTORY) {
      this.dwellTimes.shift();
    }
  }

  /**
   * Registra uma interação com a interface (mostrar/esconder menus)
   */
  recordUIToggle(): void {
    const now = Date.now();
    // Se o último toggle foi há mais de 1 minuto, resetamos o contador para essa janela
    if (now - this.lastToggleTime > this.TOGGLE_WINDOW_MS) {
      this.uiToggles = 1;
    } else {
      this.uiToggles++;
    }
    this.lastToggleTime = now;
  }

  /**
   * Determina se o usuário está em estado de Flow
   */
  isInFlow(): boolean {
    if (this.dwellTimes.length < 3) return false;

    // 1. Médias de Dwell Time
    const avgDwell = this.getAverageDwellTime();
    
    // 2. Estabilidade (Desvio Padrão)
    // Se o usuário está lendo em um ritmo constante, o desvio padrão é baixo.
    const stdDev = this.getDwellTimeStdDev(avgDwell);
    const isStable = stdDev < avgDwell * 0.4; // 40% de variação tolerada

    // 3. Critério de Dwell Time Mínimo (Configurável por modo)
    const isLongEnough = avgDwell >= this.config.flowDwellTimeMin;

    // 4. Critério de UI Toggles (Pouca distração)
    const fewToggles = this.uiToggles <= this.config.flowToggleMax;

    return isStable && isLongEnough && fewToggles;
  }

  /**
   * Getters para telemetria
   */
  getAverageDwellTime(): number {
    if (this.dwellTimes.length === 0) return 0;
    return this.dwellTimes.reduce((a, b) => a + b, 0) / this.dwellTimes.length;
  }

  getUIToggles(): number {
    return this.uiToggles;
  }

  private getDwellTimeStdDev(avg: number): number {
    if (this.dwellTimes.length === 0) return 0;
    const squareDiffs = this.dwellTimes.map(value => Math.pow(value - avg, 2));
    const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / squareDiffs.length;
    return Math.sqrt(avgSquareDiff);
  }

  /**
   * Atualiza a configuração se o modo mudar
   */
  updateConfig(config: ModeConfig): void {
    this.config = config;
  }
}
