/**
 * UIOverloadDetector
 * 
 * Heurística para detectar se o usuário está "perdido" ou sobrecarregado pela interface.
 * Baseia-se na profundidade de navegação em menus e na frequência de troca de painéis
 * sem progresso real na leitura/estudo.
 */
export class UIOverloadDetector {
  private menuDepth: number = 0;
  private panelSwitches: number = 0;
  private lastProgressTime: number = Date.now();
  private readonly PROGRESS_THRESHOLD_MS = 120000; // 2 minutos sem progresso

  /**
   * Registra a profundidade de um menu acessado
   */
  recordMenuNavigation(depth: number): void {
    this.menuDepth = Math.max(this.menuDepth, depth);
  }

  /**
   * Registra uma troca de painel (ex: Notas para Questões)
   */
  recordPanelSwitch(): void {
    this.panelSwitches++;
  }

  /**
   * Chamado quando o usuário realiza uma ação produtiva (ex: criar nota, mudar página)
   */
  recordProgress(): void {
    this.lastProgressTime = Date.now();
    this.resetActivity();
  }

  /**
   * Determina se a interface está causando sobrecarga
   */
  isOverloaded(): boolean {
    const now = Date.now();
    const timeSinceProgress = now - this.lastProgressTime;
    const noProgress = timeSinceProgress > this.PROGRESS_THRESHOLD_MS;

    // Critérios: Profundidade excessiva de menu OU trocas constantes de painel
    // combinado com falta de progresso.
    return (this.menuDepth > 3 || this.panelSwitches > 5) && noProgress;
  }

  /**
   * Retorna uma sugestão contextual para aliviar a sobrecarga
   */
  getSuggestion(): string {
    if (this.menuDepth > 3) {
      return "Dica: Use atalhos de teclado para navegar mais rápido.";
    }
    if (this.panelSwitches > 5) {
      return "Dica: Tente focar em uma tarefa por vez (ex: finalize as notas antes de criar questões).";
    }
    return "Continue seu excelente trabalho!";
  }

  private resetActivity(): void {
    this.menuDepth = 0;
    this.panelSwitches = 0;
  }
}
