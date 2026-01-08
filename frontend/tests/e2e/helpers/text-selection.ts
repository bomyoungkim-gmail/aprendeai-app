import { Page } from '@playwright/test';

/**
 * Force text selection programmatically in the browser context
 * 
 * This is more reliable than Playwright's selectText() for testing
 * React components that depend on Selection API events.
 * 
 * @param page - Playwright page object
 * @param selector - CSS selector for the element containing text
 * @param startOffset - Character offset to start selection (default: 5)
 * @param endOffset - Character offset to end selection (default: 25)
 */
export async function forceTextSelection(
  page: Page,
  selector: string,
  startOffset: number = 5,
  endOffset: number = 25
): Promise<void> {
  await page.evaluate(
    ({ sel, start, end }) => {
      const element = document.querySelector(sel);
      if (!element) throw new Error(`Element ${sel} not found`);

      // Find first text node
      const walker = document.createTreeWalker(
        element,
        NodeFilter.SHOW_TEXT,
        null
      );
      const textNode = walker.nextNode();
      if (!textNode) throw new Error('No text node found in element');

      // Create Range
      const range = document.createRange();
      range.setStart(textNode, start);
      range.setEnd(textNode, end);

      // Apply Selection
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);

      // Dispatch MouseUp to trigger useTextSelection hook
      // Use setTimeout to ensure selection is established before event
      setTimeout(() => {
        document.dispatchEvent(
          new MouseEvent('mouseup', {
            bubbles: true,
            cancelable: true,
            view: window,
          })
        );
      }, 0);
    },
    { sel: selector, start: startOffset, end: endOffset }
  );

  // Wait for React to process the event and update state
  await page.waitForTimeout(200);
}
