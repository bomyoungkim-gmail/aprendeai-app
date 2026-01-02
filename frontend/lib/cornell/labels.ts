/**
 * Centralized Cornell Notes Label Constants
 * 
 * Single source of truth for all UI labels in Portuguese.
 * DO NOT hard-code labels - import from here.
 */

export const CORNELL_LABELS = {
  SYNTHESIS: 'Síntese',
  HIGHLIGHTS_NOTES: 'Highlights & Notas',
  IMPORTANT_QUESTIONS: 'Importante & Dúvidas',
  AI_RESPONSES: 'Respostas da IA',
} as const;

export type HighlightType = 
  | 'HIGHLIGHT'
  | 'NOTE'
  | 'SYNTHESIS'
  | 'QUESTION'
  | 'IMPORTANT'
  | 'AI_RESPONSE';

export const ITEM_TYPE_LABELS: Record<HighlightType, string> = {
  HIGHLIGHT: 'Evidência',
  NOTE: 'Vocabulário',
  QUESTION: 'Dúvida',
  SYNTHESIS: 'Síntese',
  IMPORTANT: 'Ideia Central',
  AI_RESPONSE: 'IA',
};

export const ITEM_TYPE_ICONS: Record<HighlightType, string> = {
  HIGHLIGHT: '🎨',
  NOTE: '💬',
  QUESTION: '❓',
  SYNTHESIS: '📝',
  IMPORTANT: '⭐',
  AI_RESPONSE: '🤖',
};

// Action Toolbar Labels
export const ACTION_LABELS = {
  TRIAGE: 'Triagem',
  HIGHLIGHT: 'Evidência',
  NOTE: 'Vocabulário',
  QUESTION: 'Dúvida',
  AI: 'IA',
  IMPORTANT: 'Ideia Central',
} as const;

// Keyboard Shortcuts
export const KEYBOARD_SHORTCUTS = {
  HIGHLIGHT: 'h',
  NOTE: 'n',
  QUESTION: 'q',
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
    NOTE: 'Vocabulário / Termo',
    QUESTION: 'Dúvida / Loop Aberto',
    IMPORTANT: 'Ideia Central / Tese',
    HIGHLIGHT: 'Evidência / Apoio',
    SYNTHESIS: 'Nova Síntese',
  },
  FIELD: {
    NOTE: 'Definição / Contexto',
    QUESTION: 'O que está confuso?',
    IMPORTANT: 'Resumo da tese',
    HIGHLIGHT: 'Trecho de apoio',
    SYNTHESIS: 'Síntese',
  },
  PLACEHOLDER: {
    NOTE: 'Explique o termo ou use a IA para definir...',
    QUESTION: 'O que você quer perguntar ao Educator?',
    IMPORTANT: 'Qual a ideia central desse trecho?',
    HIGHLIGHT: 'Por que este trecho sustenta a tese?',
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
