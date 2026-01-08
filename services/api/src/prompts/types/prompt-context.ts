export interface PromptContext {
  // Gamificação
  /** XP total do usuário */
  XP?: number;
  /** XP ganho hoje */
  XP_TODAY?: number;
  /** Dias consecutivos de estudo */
  STREAK?: number;
  
  // SRS (Spaced Repetition System)
  /** Dias até próxima revisão */
  DAYS?: number;
  /** Total de palavras no vocabulário */
  VOCAB_COUNT?: number;
  
  // Usuário
  /** Nome do aprendiz */
  LEARNER?: string;
  /** Nível de proficiência (A1, B2, etc.) */
  LEVEL?: string;
  
  // Sessão
  /** Minutos gastos na sessão atual */
  MIN?: number;
  /** Score de compreensão (0-100) */
  COMP?: number;
  /** Palavras marcadas nesta sessão */
  WORDS_MARKED?: number;
  
  // Conteúdo
  /** Título do conteúdo */
  TITLE?: string;
  /** Percentual de progresso no conteúdo */
  PROGRESS?: number;
  /** Modo de leitura do conteúdo (TECHNICAL, DIDACTIC, etc.) */
  content_mode?: string;
  
  /** Variáveis dinâmicas adicionais */
  [key: string]: string | number | undefined;
}

