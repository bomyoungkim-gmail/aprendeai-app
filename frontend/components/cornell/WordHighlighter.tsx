/**
 * Word Highlighter Component for LANGUAGE Mode
 * 
 * UI Component - highlights studied words in text
 * Following MelhoresPraticas.txt: components for UI only
 * 
 * G6.4: Reforço contextual - destaca palavras estudadas
 */

import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';

interface WordHighlighterProps {
  contentId: string;
  children: React.ReactNode;
}

export function WordHighlighter({ contentId, children }: WordHighlighterProps) {
  const [highlightedContent, setHighlightedContent] = useState<React.ReactNode>(children);

  // Fetch studied words for this user
  const { data: studiedWords } = useQuery({
    queryKey: ['studied-words', contentId],
    queryFn: async (): Promise<Set<string>> => {
      const response = await api.get('/srs/studied-words');
      return new Set(response.data.map((w: any) => w.toLowerCase()));
    }
  });

  useEffect(() => {
    if (!studiedWords || studiedWords.size === 0) {
      setHighlightedContent(children);
      return;
    }

    // Process text content to highlight studied words
    const processNode = (node: React.ReactNode): React.ReactNode => {
      if (typeof node === 'string') {
        return highlightWords(node, studiedWords);
      }

      if (React.isValidElement(node)) {
        const children = React.Children.map(node.props.children, processNode);
        return React.cloneElement(node, {}, children);
      }

      return node;
    };

    setHighlightedContent(processNode(children));
  }, [children, studiedWords]);

  return <>{highlightedContent}</>;
}

/**
 * Highlight studied words in text
 */
function highlightWords(text: string, studiedWords: Set<string>): React.ReactNode {
  // Split by word boundaries
  const words = text.split(/(\s+)/);
  
  return words.map((word, index) => {
    // Clean word for comparison (remove punctuation)
    const cleanWord = word.replace(/[.,!?;:()]/g, '').toLowerCase();
    
    if (studiedWords.has(cleanWord)) {
      return (
        <mark
          key={index}
          className="bg-yellow-200 dark:bg-yellow-800 rounded px-0.5"
          title={`Palavra estudada: ${cleanWord}`}
        >
          {word}
        </mark>
      );
    }
    
    return word;
  });
}

/**
 * Hook version for programmatic use
 */
export function useWordHighlighting(contentId: string) {
  const { data: studiedWords, isLoading } = useQuery({
    queryKey: ['studied-words', contentId],
    queryFn: async (): Promise<Set<string>> => {
      const response = await api.get('/srs/studied-words');
      return new Set(response.data.map((w: any) => w.toLowerCase()));
    }
  });

  const isStudiedWord = (word: string): boolean => {
    if (!studiedWords) return false;
    const cleanWord = word.replace(/[.,!?;:()]/g, '').toLowerCase();
    return studiedWords.has(cleanWord);
  };

  return {
    studiedWords,
    isStudiedWord,
    isLoading
  };
}
