import type { PageContext, ReadabilityArticle } from './types';

/**
 * Content script - runs in webpage context
 * Handles selection extraction and Readability parsing
 */

// Listen for messages from background/sidepanel
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_PAGE_CONTEXT') {
    const context = getPageContext();
    sendResponse(context);
    return true;
  }

  if (message.type === 'EXTRACT_READABILITY') {
    extractReadability()
      .then(article => sendResponse(article))
      .catch(error => sendResponse({ contentText: '', error: String(error) }));
    return true; // Keep channel open for async response
  }

  return false;
});

/**
 * Get current page context  
 */
function getPageContext(): PageContext {
  const selection = window.getSelection();
  const selectionText = selection ? selection.toString().slice(0, 5000) : '';

  return {
    url: location.href,
    title: document.title,
    domain: location.hostname,
    selectionText,
  };
}

/**
 * Extract clean content using Readability
 * Requires vendor/readability.js to be loaded
 */
async function extractReadability(): Promise<ReadabilityArticle> {
  try {
    // @ts-ignore - Readability is loaded from vendor/readability.js
    if (typeof Readability === 'undefined') {
      throw new Error('Readability library not loaded');
    }

    const documentClone = document.cloneNode(true) as Document;
    
    // @ts-ignore
    const article = new Readability(documentClone).parse();

    if (!article) {
      throw new Error('Failed to parse article');
    }

    // Limit content size (50k chars)
    const contentText = (article.textContent || '').slice(0, 50000);

    return {
      contentText,
      title: article.title || document.title,
    };
  } catch (error) {
    console.error('[WebClip] Readability extraction failed:', error);
    throw error;
  }
}
