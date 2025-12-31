import { Module } from "@nestjs/common";
import { LLMService } from "./llm.service";
import { LLMConfigService } from "./llm-config.service";
import { OpenAIProvider } from "./providers/openai.provider";
import { GeminiProvider } from "./providers/gemini.provider";
import { AnthropicProvider } from "./providers/anthropic.provider";
import { DegradedModeProvider } from "./providers/degraded.provider";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  providers: [
    LLMService,
    LLMConfigService,
    OpenAIProvider,
    GeminiProvider,
    AnthropicProvider,
    DegradedModeProvider,
  ],
  exports: [LLMService, LLMConfigService],
})
export class LLMModule {}
