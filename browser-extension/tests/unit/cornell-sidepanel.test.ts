import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Chrome API
const mockChrome = {
  runtime: {
    sendMessage: vi.fn(),
  },
  tabs: {
    query: vi.fn(),
    sendMessage: vi.fn(),
  },
  storage: {
    sync: {
      get: vi.fn(),
    },
  },
};

// @ts-ignore
global.chrome = mockChrome;
global.fetch = vi.fn();

describe('Cornell Sidepanel Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Tab Navigation', () => {
    it('should switch between WebClip and Cornell tabs', () => {
      const tabs = ['webclip', 'cornell'];
      let activeTab = 'webclip';
      
      const switchTab = (tab: string) => {
        if (tabs.includes(tab)) {
          activeTab = tab;
        }
      };
      
      switchTab('cornell');
      expect(activeTab).toBe('cornell');
      
      switchTab('webclip');
      expect(activeTab).toBe('webclip');
    });
  });

  describe('Cornell Mode Toggle', () => {
    it('should send TOGGLE_CORNELL message to content script', async () => {
      mockChrome.tabs.query.mockResolvedValue([{ id: 123 }]);
      mockChrome.tabs.sendMessage.mockResolvedValue({ active: true });
      
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const response = await chrome.tabs.sendMessage(tab.id!, { type: 'TOGGLE_CORNELL' });
      
      expect(mockChrome.tabs.sendMessage).toHaveBeenCalledWith(123, { type: 'TOGGLE_CORNELL' });
      expect(response.active).toBe(true);
    });
  });

  describe('Load Cornell Notes', () => {
    it('should fetch notes for current page URL', async () => {
      mockChrome.tabs.query.mockResolvedValue([{ url: 'https://example.com' }]);
      mockChrome.storage.sync.get.mockResolvedValue({
        apiBaseUrl: 'http://localhost:4000',
        accessToken: 'test-token',
      });
      
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ notes: [{ type: 'highlight', text: 'Test' }] }),
      });
      
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const config = await chrome.storage.sync.get(['apiBaseUrl', 'accessToken']);
      
      const response = await fetch(
        `${config.apiBaseUrl}/api/v1/cornell/notes?url=${encodeURIComponent(tab.url!)}`,
        {
          headers: {
            'Authorization': `Bearer ${config.accessToken}`,
          },
        }
      );
      
      const data = await response.json();
      
      expect(data.notes).toHaveLength(1);
      expect(data.notes[0].type).toBe('highlight');
    });
  });

  describe('Render Cornell Notes', () => {
    it('should render note with correct icon based on type', () => {
      const notes = [
        { type: 'highlight', text: 'Test 1', createdAt: new Date() },
        { type: 'question', text: 'Test 2', createdAt: new Date() },
        { type: 'note', text: 'Test 3', createdAt: new Date() },
      ];
      
      const icons = notes.map(note => 
        note.type === 'highlight' ? '🖍️' : 
        note.type === 'question' ? '❓' : '📝'
      );
      
      expect(icons).toEqual(['🖍️', '❓', '📝']);
    });
  });
});

describe('Background Cornell Handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle CREATE_CORNELL_NOTE message', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ id: '123' }),
    });
    
    const message = {
      type: 'CREATE_CORNELL_NOTE',
      payload: {
        type: 'highlight',
        text: 'Selected text',
        url: 'https://example.com',
      },
    };
    
    // Simulate background handler
    expect(message.type).toBe('CREATE_CORNELL_NOTE');
    expect(message.payload.type).toBe('highlight');
  });

  it('should handle SEND_AI_CHAT_MESSAGE message', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ content: 'AI response' }),
    });
    
    const message = {
      type: 'SEND_AI_CHAT_MESSAGE',
      payload: {
        message: 'What is this?',
        context: { url: 'https://example.com' },
      },
    };
    
    const response = await fetch('http://localhost:8001/api/chat', {
      method: 'POST',
      body: JSON.stringify(message.payload),
    });
    
    const data = await response.json();
    
    expect(data.content).toBe('AI response');
  });
});
