/**
 * DOM Utility functions and constants
 */

export const INPUT_TAGS = ['INPUT', 'TEXTAREA'] as const;

/**
 * Checks if an element is an input-like element (captures user typing)
 */
export function isInputLike(element: HTMLElement | EventTarget | null): boolean {
  if (!element || !(element instanceof HTMLElement)) return false;
  
  return (
    INPUT_TAGS.includes(element.tagName as any) || 
    element.isContentEditable
  );
}
