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
  | 'SUMMARY'
  | 'QUESTION'
  | 'STAR'
  | 'AI_RESPONSE';

export const ITEM_TYPE_LABELS: Record<HighlightType, string> = {
  HIGHLIGHT: 'Destaque',
  NOTE: 'Nota',
  QUESTION: 'Dúvida',
  SUMMARY: 'Síntese',
  STAR: 'Estrela',
  AI_RESPONSE: 'IA',
};

export const ITEM_TYPE_ICONS: Record<HighlightType, string> = {
  HIGHLIGHT: '🎨',
  NOTE: '💬',
  QUESTION: '❓',
  SUMMARY: '📝',
  STAR: '⭐',
  AI_RESPONSE: '🤖',
};

// Action Toolbar Labels
export const ACTION_LABELS = {
  TRIAGE: 'Triagem',
  HIGHLIGHT: 'Highlight',
  NOTE: 'Nota',
  QUESTION: 'Dúvida',
  AI: 'IA',
  STAR: 'Destaque',
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
    NOTE: 'Nova Nota',
    QUESTION: 'Nova Questão',
    STAR: 'Novo Importante',
    HIGHLIGHT: 'Novo Destaque',
    SUMMARY: 'Nova Síntese',
  },
  FIELD: {
    NOTE: 'Anotação',
    QUESTION: 'Questão',
    STAR: 'Importante',
    HIGHLIGHT: 'Destaque',
    SUMMARY: 'Síntese',
  },
  PLACEHOLDER: {
    NOTE: 'Digite sua anotação...',
    QUESTION: 'Digite sua questão...',
    STAR: 'Digite o ponto importante...',
    HIGHLIGHT: 'Digite o destaque...',
    SUMMARY: 'Digite sua síntese...',
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
