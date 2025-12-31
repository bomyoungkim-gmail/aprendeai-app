import { Module, Global } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AIContentService } from "./ai-content.service";
import { LLMModule } from "../../llm/llm.module";

@Global()
@Module({
  imports: [ConfigModule, LLMModule],
  providers: [AIContentService],
  exports: [AIContentService],
})
export class AIContentModule {}
