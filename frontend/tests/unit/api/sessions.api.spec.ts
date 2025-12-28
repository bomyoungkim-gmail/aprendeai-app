/**
 * Sessions API Tests
 * 
 * Comprehensive tests for Sessions API
 */

import { sessionsApi } from '@/services/api/sessions.api';
// Mock API
jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

import api from '@/lib/api';

describe('SessionsApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('startSession', () => {
    it('should start session successfully', async () => {
      const payload = { contentId: '123' };
      const mockSession = { id: 's1', ...payload };
      (api.post as jest.Mock).mockResolvedValue({ data: mockSession });

      const result = await sessionsApi.startSession(payload);

      expect(api.post).toHaveBeenCalledWith('/sessions/start', payload);
      expect(result).toEqual(mockSession);
    });
  });

  describe('getSession', () => {
    it('should get session details', async () => {
      const mockSession = { id: 's1' };
      (api.get as jest.Mock).mockResolvedValue({ data: mockSession });

      const result = await sessionsApi.getSession('s1');

      expect(api.get).toHaveBeenCalledWith('/sessions/s1');
      expect(result).toEqual(mockSession);
    });
  });

  describe('sendPrompt', () => {
    it('should send prompt', async () => {
      const payload = { text: 'Hello' };
      (api.post as jest.Mock).mockResolvedValue({ data: { response: 'Hi' } });

      const result = await sessionsApi.sendPrompt('s1', payload);

      expect(api.post).toHaveBeenCalledWith('/sessions/s1/prompt', payload);
      expect(result).toEqual({ response: 'Hi' });
    });
  });

  describe('finishSession', () => {
    it('should finish session', async () => {
      (api.post as jest.Mock).mockResolvedValue({ data: { success: true } });

      const result = await sessionsApi.finishSession('s1');

      expect(api.post).toHaveBeenCalledWith('/sessions/s1/finish');
    });
  });

  describe('getEvents', () => {
    it('should get session events', async () => {
      const mockEvents = [{ id: 'e1', type: 'HIGHLIGHT' }];
      (api.get as jest.Mock).mockResolvedValue({ data: mockEvents });

      const result = await sessionsApi.getEvents('s1');

      expect(api.get).toHaveBeenCalledWith('/sessions/s1/events');
      expect(result).toEqual(mockEvents);
    });
  });
});
