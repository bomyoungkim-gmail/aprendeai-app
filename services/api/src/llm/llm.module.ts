import { Module } from '@nestjs/common';
import { LLMService } from './llm.service';
import { OpenAIProvider } from './providers/openai.provider';
import { DegradedModeProvider } from './providers/degraded.provider';

@Module({
  providers: [LLMService, OpenAIProvider, DegradedModeProvider],
  exports: [LLMService],
})
export class LLMModule {}
