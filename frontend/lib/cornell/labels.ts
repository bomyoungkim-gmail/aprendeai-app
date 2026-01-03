/**
 * Centralized Cornell Notes Label Constants
 * 
 * Single source of truth for all UI labels in Portuguese.
 * DO NOT hard-code labels - import from here.
 */

export const CORNELL_LABELS = {
  SYNTHESIS: 'Síntese',
  EVIDENCE_VOCABULARY: 'Evidências & Vocabulário',
  IDEAS_DOUBTS: 'Ideias & Dúvidas',
  AI_RESPONSES: 'Respostas da IA',
} as const;

export type HighlightType = 
  | 'EVIDENCE'
  | 'VOCABULARY'
  | 'SYNTHESIS'
  | 'DOUBT'
  | 'MAIN_IDEA'
  | 'AI_RESPONSE';

export const ITEM_TYPE_LABELS: Record<HighlightType, string> = {
  EVIDENCE: 'Evidência',
  VOCABULARY: 'Vocabulário',
  DOUBT: 'Dúvida',
  SYNTHESIS: 'Síntese',
  MAIN_IDEA: 'Ideia Central',
  AI_RESPONSE: 'IA',
};

export const ITEM_TYPE_ICONS: Record<HighlightType, string> = {
  EVIDENCE: '🎨',
  VOCABULARY: '💬',
  DOUBT: '❓',
  SYNTHESIS: '📝',
  MAIN_IDEA: '⭐',
  AI_RESPONSE: '🤖',
};

// Action Toolbar Labels
export const ACTION_LABELS = {
  TRIAGE: 'Triagem',
  EVIDENCE: 'Evidência',
  VOCABULARY: 'Vocabulário',
  DOUBT: 'Dúvida',
  AI: 'IA',
  MAIN_IDEA: 'Ideia Central',
} as const;

// Keyboard Shortcuts
export const KEYBOARD_SHORTCUTS = {
  EVIDENCE: 'h',
  VOCABULARY: 'v',
  DOUBT: 'q',
  AI: '/',
} as const;

export const CHAT_LABELS = {
  TITLE: 'Assistente de Leitura',
  PLACEHOLDER: 'Digite sua dúvida aqui...',
  SEND: 'Enviar',
  EMPTY_STATE: 'Olá! Sou seu assistente. Como posso ajudar com este documento?',
  CLOSE: 'Fechar chat',
} as const;

// Modal Labels (for CreateHighlightModal)
export const CORNELL_MODAL_LABELS = {
  TITLE: {
    VOCABULARY: 'Vocabulário / Termo',
    DOUBT: 'Dúvida / Loop Aberto',
    MAIN_IDEA: 'Ideia Central / Tese',
    EVIDENCE: 'Evidência / Apoio',
    SYNTHESIS: 'Nova Síntese',
  },
  FIELD: {
    VOCABULARY: 'Definição / Contexto',
    DOUBT: 'O que está confuso?',
    MAIN_IDEA: 'Resumo da tese',
    EVIDENCE: 'Trecho de apoio',
    SYNTHESIS: 'Síntese',
  },
  PLACEHOLDER: {
    VOCABULARY: 'Explique o termo ou use a IA para definir...',
    DOUBT: 'O que você quer perguntar ao Educator?',
    MAIN_IDEA: 'Qual a ideia central desse trecho?',
    EVIDENCE: 'Por que este trecho sustenta a tese?',
    SYNTHESIS: 'Digite sua síntese...',
  },
  BUTTONS: {
    CANCEL: 'Cancelar',
    SAVE: 'Salvar',
    SAVING: 'Salvando...',
    CLOSE_MODAL: 'Fechar modal',
  },
  MESSAGES: {
    NO_SYNTHESIS: 'Nenhuma síntese encontrada.',
    CREATE_FIRST: 'Criar primeira síntese',
    ADD_SYNTHESIS: 'Adicionar Síntese',
  },
} as const;
