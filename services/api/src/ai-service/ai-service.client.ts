import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import * as crypto from 'crypto';
import { PromptMessageDto } from '../sessions/dto/prompt-message.dto';
import { AgentTurnResponseDto } from '../sessions/dto/agent-turn-response.dto';

/**
 * AI Service Client
 * 
 * Phase 1: Stub implementation
 * Phase 2: Real HTTP client to FastAPI Educator Agent ✅
 * Phase 0: HMAC authentication added ✅
 */
@Injectable()
export class AiServiceClient {
  private readonly logger = new Logger(AiServiceClient.name);
  private readonly AI_SERVICE_URL: string;
  private readonly AI_SERVICE_SECRET: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    // Centralized configuration - no hardcoded URLs!
    this.AI_SERVICE_URL = this.configService.get<string>(
      'AI_SERVICE_URL',
      'http://localhost:8001',
    );
    
    this.AI_SERVICE_SECRET = this.configService.getOrThrow<string>(
      'AI_SERVICE_SECRET'
    );
    
    if (!this.AI_SERVICE_SECRET || this.AI_SERVICE_SECRET.length < 32) {
      throw new Error(
        'AI_SERVICE_SECRET must be set and at least 32 characters. ' +
        'Generate with: openssl rand -hex 32'
      );
    }
    
    this.logger.log(`AI Service Client initialized: ${this.AI_SERVICE_URL}`);
    this.logger.log('HMAC Authentication: ENABLED (Phase 0)');
  }

  /**
   * Sign request body with HMAC-SHA256
   */
  private signRequest(body: string): string {
    const hmac = crypto.createHmac('sha256', this.AI_SERVICE_SECRET);
    hmac.update(body);
    return `sha256=${hmac.digest('hex')}`;
  }

  /**
   * Send prompt to Educator Agent and get response.
   * 
   * POST {AI_SERVICE_URL}/educator/turn
   * 
   * Phase 2: Real implementation ✅
   * Phase 0: HMAC signing ✅
   */
  async sendPrompt(
    promptMessage: PromptMessageDto,
  ): Promise<AgentTurnResponseDto> {
    const url = `${this.AI_SERVICE_URL}/educator/turn`;
    const correlationId = promptMessage.threadId; // Use threadId as correlation ID
    
    // Prepare request body
    const requestBody = { promptMessage };
    const bodyString = JSON.stringify(requestBody);
    
    // Sign request
    const signature = this.signRequest(bodyString);
    
    this.logger.debug(
      `Sending prompt to AI Service: session=${promptMessage.readingSessionId}, correlationId=${correlationId}`,
    );

    try {
      const response = await firstValueFrom(
        this.httpService.post<AgentTurnResponseDto>(url, requestBody, {
          timeout: 30000, // 30s timeout
          headers: {
            'Content-Type': 'application/json',
            'X-Signature': signature,              // Phase 0: HMAC signature
            'X-Correlation-ID': correlationId,      // Phase 0: Correlation tracking
            'X-Request-ID': promptMessage.threadId, // Legacy, kept for compatibility
          },
        }),
      );
      return response.data;
    } catch (error) {
      this.logger.error(`AI Service call failed (correlationId=${correlationId})`, error);
      throw new Error('Failed to communicate with AI Service');
    }
  }
}
