# LLM Fallback System - Usage Guide

## Overview

The LLM module provides a robust fallback system for AI/LLM services with automatic retry logic and graceful degradation.

## Features

- ✅ **Multiple Providers:** OpenAI (primary), Degraded Mode (fallback)
- ✅ **Automatic Retry:** 3 attempts with exponential backoff
- ✅ **Rate Limit Handling:** Immediate fallback on 429 errors
- ✅ **Graceful Degradation:** Returns helpful messages when AI unavailable
- ✅ **Health Checks:** Provider availability checks
- ✅ **Configurable:** Timeout, retries, model selection

## Installation

```bash
npm install openai --legacy-peer-deps
```

## Environment Variables

```env
# Required
OPENAI_API_KEY=sk-...

# Optional
OPENAI_MODEL=gpt-3.5-turbo
LLM_MAX_RETRIES=3
LLM_RETRY_DELAY=1000
LLM_TIMEOUT=10000
```

## Usage

### Basic Example

```typescript
import { Injectable } from "@nestjs/common";
import { LLMService } from "./llm/llm.service";

@Injectable()
export class MyService {
  constructor(private llmService: LLMService) {}

  async generateSummary(text: string) {
    const prompt = `Summarize this text:\n\n${text}`;

    const response = await this.llmService.generateText(prompt, {
      temperature: 0.7,
      maxTokens: 200,
      allowDegraded: true, // Allow fallback
    });

    return response.text;
  }
}
```

### Advanced Example - Q&A Generation

```typescript
@Injectable()
export class QACardService {
  constructor(private llmService: LLMService) {}

  async generateQA(
    text: string
  ): Promise<{ question: string; answer: string }> {
    const prompt = `Generate a question and answer from this text:\n\n${text}\n\nFormat:\nQ: [question]\nA: [answer]`;

    try {
      const response = await this.llmService.generateText(prompt, {
        temperature: 0.7,
        maxTokens: 200,
        model: "gpt-3.5-turbo",
        timeout: 10000,
        allowDegraded: false, // Don't allow degraded mode
      });

      // Parse response
      const lines = response.text.split("\n");
      const question = lines
        .find((l) => l.startsWith("Q:"))
        ?.replace("Q:", "")
        .trim();
      const answer = lines
        .find((l) => l.startsWith("A:"))
        ?.replace("A:", "")
        .trim();

      if (!question || !answer) {
        throw new Error("Failed to parse Q&A");
      }

      return { question, answer };
    } catch (error) {
      throw new BadRequestException(
        "AI service unavailable. Please try again later."
      );
    }
  }
}
```

### Check AI Availability

```typescript
async checkAI() {
  const isAvailable = await this.llmService.isAIAvailable();

  if (!isAvailable) {
    // Show warning to user or disable AI features
    return { aiEnabled: false };
  }

  return { aiEnabled: true };
}
```

## Module Registration

Add to your module imports:

```typescript
import { Module } from "@nestjs/common";
import { LLMModule } from "./llm/llm.module";

@Module({
  imports: [LLMModule],
  // ...
})
export class AppModule {}
```

## Error Handling

The service automatically handles:

- **Network errors:** Retries 3 times
- **Timeouts:** Retries with backoff
- **Rate limits (429):** Immediate fallback
- **Quota exceeded:** Immediate fallback
- **Invalid API key:** Falls back to degraded mode

## Response Format

```typescript
{
  text: string;                // Generated text
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  provider: string;            // 'openai' or 'degraded'
  model: string;               // Model used
}
```

## Testing

Run unit tests:

```bash
npm test -- llm.service.spec.ts
```

## Future Enhancements

- Add Gemini provider as secondary fallback
- Implement caching for common prompts
- Add usage tracking and cost monitoring
- Circuit breaker pattern
- Admin dashboard for provider health

## Troubleshooting

### OpenAI not working

1. Check `OPENAI_API_KEY` is set
2. Verify API key format (starts with `sk-`)
3. Check quota/billing on OpenAI dashboard
4. Review logs for specific errors

### All providers failing

- Service will throw: `"All LLM providers failed"`
- Check if `allowDegraded: true` is set
- Review application logs for root cause

### Rate limits

- Service automatically falls back
- Consider implementing request queueing
- Monitor usage with OpenAI dashboard
