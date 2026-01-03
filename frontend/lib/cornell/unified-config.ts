/**
 * Cornell Notes - Unified Configuration
 * 
 * Single source of truth for all Cornell Notes UI configuration.
 * Includes annotation types, sidebar tabs, icons, and colors.
 */

import {
  Highlighter,      // 🎨 Destaque
  MessageSquare,    // 💬 Nota
  Star,             // ⭐ Importante
  HelpCircle,       // ❓ Dúvida
  FileCheck,        // 📝 Síntese
  Sparkles,         // ✨ IA
  BookOpen,         // 📖 Vocabulário
  FileText,         // 📝 Stream/Anotações
  BarChart3,        // 📊 Analytics
  MessageCircle,    // 💬 Chat
  List,             // 📋 Sumário/TOC
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// ============================================
// ANNOTATION TYPES CONFIGURATION
// ============================================

export interface AnnotationTypeConfig {
  id: string;
  type: string;
  label: string;
  icon: LucideIcon;
  color: string;
  emoji: string;
  shortcut?: string;
  tags: string[];
  forceColor?: boolean; 
}

export const CORNELL_CONFIG: Record<string, AnnotationTypeConfig> = {
  EVIDENCE: {
    id: 'evidence',
    type: 'EVIDENCE',
    label: 'Evidência',
    icon: Highlighter,
    color: 'yellow',
    emoji: '🎨',
    shortcut: 'E',
    tags: ['evidence'],
    forceColor: false,
  },
  VOCABULARY: {
    id: 'vocabulary',
    type: 'VOCABULARY',
    label: 'Vocabulário',
    icon: BookOpen,
    color: 'blue',
    emoji: '📖',
    shortcut: 'V',
    tags: ['vocab'],
    forceColor: true,
  },
  MAIN_IDEA: {
    id: 'main-idea',
    type: 'MAIN_IDEA',
    label: 'Ideia Central',
    icon: Star,
    color: 'green',
    emoji: '⭐',
    shortcut: 'I',
    tags: ['main-idea'],
    forceColor: true,
  },
  DOUBT: {
    id: 'doubt',
    type: 'DOUBT',
    label: 'Dúvida',
    icon: HelpCircle,
    color: 'red',
    emoji: '❓',
    shortcut: 'Q',
    tags: ['doubt'],
    forceColor: true,
  },
  SYNTHESIS: {
    id: 'synthesis',
    type: 'SYNTHESIS',
    label: 'Síntese',
    icon: FileCheck,
    color: 'purple',
    emoji: '📝',
    shortcut: undefined,
    tags: ['synthesis'],
    forceColor: true,
  },
  AI: {
    id: 'ai',
    type: 'AI',
    label: 'IA',
    icon: Sparkles,
    color: 'purple',
    emoji: '✨',
    shortcut: '/',
    tags: ['ai'],
    forceColor: true,
  },
} as const;

// ============================================
// SIDEBAR TABS CONFIGURATION (SIMPLIFIED)
// ============================================

export interface SidebarTabConfig {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  testId: string;
  filters?: string[];
}

export const SIDEBAR_TABS_CONFIG: Record<string, SidebarTabConfig> = {
  TOC: {
    id: 'toc',
    label: 'Sumário',
    description: 'Índice e navegação do documento',
    icon: List,
    testId: 'tab-toc',
  },
  STREAM: {
    id: 'stream',
    label: 'Anotações',
    description: 'Todas as anotações com filtros por tipo',
    icon: FileText,
    testId: 'tab-stream',
    filters: ['all', 'evidence', 'vocabulary', 'main-idea', 'doubt', 'synthesis'],
  },
  SYNTHESIS: {
    id: 'synthesis',
    label: 'Síntese',
    description: 'Resumo geral do documento completo',
    icon: FileCheck,
    testId: 'tab-synthesis',
  },
  ANALYTICS: {
    id: 'analytics',
    label: 'Analytics',
    description: 'Métricas organizadas: tempo, foco, progresso',
    icon: BarChart3,
    testId: 'tab-analytics',
  },
  CHAT: {
    id: 'chat',
    label: 'Chat',
    description: 'Conversas e discussões colaborativas',
    icon: MessageCircle,
    testId: 'tab-chat',
  },
  /* 
  TODO: Future Implementation - BOOKMARKS tab
  BOOKMARKS: {
    id: 'bookmarks',
    label: 'Marcadores',
    description: 'Favoritos de página e pontos de interesse',
    icon: Bookmark,
    testId: 'tab-bookmarks',
  },
  */
} as const;

export type SidebarTabId = typeof SIDEBAR_TABS_CONFIG[keyof typeof SIDEBAR_TABS_CONFIG]['id'];
