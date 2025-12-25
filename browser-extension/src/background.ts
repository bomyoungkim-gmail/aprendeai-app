import { APIClient } from './api';
import type {
  Config,
  PageContext,
  ReadabilityArticle,
  CreateWebClipPayload,
  CaptureMode,
} from './types';

/**
 * Background service worker (MV3)
 * Orchestrates API calls and coordinates between content script and sidepanel
 */

// Open sidepanel when extension icon is clicked
chrome.action.onClicked.addListener(async (tab) => {
  if (tab.id) {
    await chrome.sidePanel.open({ tabId: tab.id });
  }
});

// Listen for messages from sidepanel
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'CREATE_WEBCLIP_SELECTION') {
    handleCreateWebClip('SELECTION', message.payload)
      .then(result => sendResponse({ success: true, ...result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep channel open for async
  }

  if (message.type === 'CREATE_WEBCLIP_READABILITY') {
    handleCreateWebClip('READABILITY', message.payload)
      .then(result => sendResponse({ success: true, ...result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (message.type === 'CREATE_WEBCLIP_TEACHER') {
    handleTeacherMode(message.payload)
      .then(result => sendResponse({ success: true, ...result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  return false;
});

/**
 * Handle WebClip creation (student mode)
 */
async function handleCreateWebClip(
  mode: CaptureMode,
  payload: CreateWebClipPayload,
): Promise<any> {
  // Get config
  const config = await getConfig();
  if (!config.apiBaseUrl || !config.authToken) {
    throw new Error('Extension not configured. Please set API URL and token in options.');
  }

  const api = new APIClient(config.apiBaseUrl, config.authToken);

  // Check parental controls if in student mode
  if (mode === 'READABILITY') {
    try {
      // We need to fetch context first
      const context = await api.get('/users/me/context');
      
      if (context.familyId) {
        // Classify content using title/excerpt from page
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const pageContext: PageContext = await chrome.tabs.sendMessage(tab!.id!, { type: 'GET_PAGE_CONTEXT' });
        
        // Quick classification check (simulated for now, real implementation would call classification endpoint)
        // In real flow: await api.classifyContent(...)
        
        const { minAge, maxAge } = context.contentFilters;
        // Logic to block would go here. For now we log it.
        console.log(`[Extension] Content filters: ${minAge}-${maxAge}`);
      }
    } catch (e) {
      console.error('Failed to check validation', e);
    }
  }

  // Get active tab

  // Get active tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab.id) throw new Error('No active tab');

  // Get page context
  const pageContext: PageContext = await chrome.tabs.sendMessage(tab.id, {
    type: 'GET_PAGE_CONTEXT',
  });

  let contentText = '';
  let selectionText = pageContext.selectionText;

  // Extract content based on mode
  if (mode === 'READABILITY') {
    const article: ReadabilityArticle = await chrome.tabs.sendMessage(tab.id, {
      type: 'EXTRACT_READABILITY',
    });
    contentText = article.contentText;
  }

  // Create API client
  const api = new APIClient(config.apiBaseUrl, config.authToken);

  // Create WebClip
  const webClipResponse = await api.createWebClip({
    sourceUrl: pageContext.url,
    title: pageContext.title,
    siteDomain: pageContext.domain,
    captureMode: mode,
    selectionText: mode === 'SELECTION' ? selectionText : undefined,
    contentText: mode === 'READABILITY' ? contentText : undefined,
    languageHint: 'PT',
    tags: ['webclip', 'extension'],
  });

  // Start session
  const sessionResponse = await api.startSession(webClipResponse.contentId, {
    assetLayer: 'L1',
    readingIntent: payload.readingIntent,
    timeboxMin: payload.timeboxMin,
  });

  // Open reader in new tab
  const readerUrl = `${config.apiBaseUrl.replace('/api', '')}/reader/${webClipResponse.contentId}?session=${sessionResponse.readingSessionId}`;
  
  await chrome.tabs.create({ url: readerUrl });

  return {
    contentId: webClipResponse.contentId,
    sessionId: sessionResponse.readingSessionId,
    readerUrl,
  };
}

/**
 * Handle teacher mode (assign to classroom)
 */
async function handleTeacherMode(payload: any): Promise<any> {
  const config = await getConfig();
  const api = new APIClient(config.apiBaseUrl, config.authToken);

  // Get active tab context
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab.id) throw new Error('No active tab');

  const pageContext: PageContext = await chrome.tabs.sendMessage(tab.id, {
    type: 'GET_PAGE_CONTEXT',
  });

  const article: ReadabilityArticle = await chrome.tabs.sendMessage(tab.id, {
    type: 'EXTRACT_READABILITY',
  });

  // Create WebClip first
  const webClipResponse = await api.createWebClip({
    sourceUrl: pageContext.url,
    title: article.title,
    siteDomain: pageContext.domain,
    captureMode: 'READABILITY',
    contentText: article.contentText,
    tags: ['webclip', 'classroom', payload.classroomId],
  });

  // Send prompt to classroom planning endpoint
  const promptResponse = await api.sendClassroomPlanPrompt(payload.classroomId, {
    threadId: `th_cls_web_${Date.now()}`,
    actorRole: 'EDUCATOR',
    text: `Quero adicionar este artigo ao plano semanal. URL: ${pageContext.url}`,
    metadata: {
      contentId: webClipResponse.contentId,
      sourceUrl: pageContext.url,
      classroomId: payload.classroomId,
    },
  });

  return {
    contentId: webClipResponse.contentId,
    promptResponse,
  };
}

/**
 * Get stored config
 */
async function getConfig(): Promise<Config> {
  const result = await chrome.storage.sync.get(['apiBaseUrl', 'authToken']);
  return {
    apiBaseUrl: result.apiBaseUrl || '',
    authToken: result.authToken || '',
  };
}
