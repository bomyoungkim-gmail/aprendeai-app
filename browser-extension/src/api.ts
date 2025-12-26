import type {
  CreateWebClipRequest,
  WebClipResponse,
  StartSessionRequest,
  StartSessionResponse,
  ClassroomsResponse,
} from './types';

/**
 * API Client for AprendeAI backend
 * Uses centralized routes (mirroring backend ROUTES.WEBCLIP)
 */
export class APIClient {
  constructor(
    private baseUrl: string,
    private token: string,
  ) {}

  /**
   * Create WebClip from browser extension
   * Route: POST /api/v1/webclips (ROUTES.WEBCLIP.CREATE)
   */
  async createWebClip(data: CreateWebClipRequest): Promise<WebClipResponse> {
    return this.fetch('/api/v1/webclips', 'POST', data);
  }

  /**
   * Start reading session for WebClip
   * Route: POST /api/v1/webclips/:contentId/sessions/start (ROUTES.WEBCLIP.START_SESSION)
   */
  async startSession(
    contentId: string,
    params: StartSessionRequest,
  ): Promise<StartSessionResponse> {
    return this.fetch(`/api/v1/webclips/${contentId}/sessions/start`, 'POST', params);
  }

  /**
   * Get teacher's classrooms
   * Route: GET /api/v1/classrooms/mine
   */
  async getMyClassrooms(): Promise<ClassroomsResponse> {
    return this.fetch('/api/v1/classrooms/mine', 'GET');
  }

  /**
   * Send prompt to classroom planning
   * Route: POST /api/v1/classrooms/:id/plans/weekly/prompt
   */
  async sendClassroomPlanPrompt(classroomId: string, prompt: any) {
    return this.fetch(`/api/v1/classrooms/${classroomId}/plans/weekly/prompt`, 'POST', prompt);
  }

  /**
   * Get user's session history
   * Route: GET /api/v1/sessions
   */
  async getSessionsHistory(params?: {
    page?: number;
    limit?: number;
    since?: string;
    until?: string;
    phase?: 'PRE' | 'DURING' | 'POST';
    query?: string;
  }) {
    const queryString = params ? '?' + new URLSearchParams(
      Object.entries(params)
        .filter(([_, v]) => v !== undefined)
        .map(([k, v]) => [k, String(v)])
    ).toString() : '';
    
    return this.fetch(`/api/v1/sessions${queryString}`, 'GET');
  }

  /**
   * Create Cornell Note
   * Route: POST /api/v1/cornell/notes
   */
  async createCornellNote(data: {
    type: string;
    text: string;
    url: string;
    context?: any;
  }): Promise<{ id: string }> {
    return this.fetch('/api/v1/cornell/notes', 'POST', data);
  }

  /**
   * Get Cornell Notes for URL
   * Route: GET /api/v1/cornell/notes?url=...
   */
  async getCornellNotes(url: string): Promise<{ notes: any[] }> {
    const encodedUrl = encodeURIComponent(url);
    return this.fetch(`/api/v1/cornell/notes?url=${encodedUrl}`, 'GET');
  }

  /**
   * Send AI Chat Message
   * Route: POST /api/v1/cornell/chat (proxied to AI service)
   */
  async sendChatMessage(data: {
    message: string;
    context?: any;
  }): Promise<{ content: string }> {
    return this.fetch('/api/v1/cornell/chat', 'POST', data);
  }

  /**
   * Generic fetch wrapper
   */
  private async fetch(path: string, method: string, body?: any): Promise<any> {
    const url = `${this.baseUrl}${path}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`,
    };

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API Error: ${response.status} - ${error}`);
    }

    return response.json();
  }
}
