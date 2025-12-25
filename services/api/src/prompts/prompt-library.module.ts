import { Module } from "@nestjs/common";
import { PromptLibraryService } from "./prompt-library.service";

@Module({
  providers: [PromptLibraryService],
  exports: [PromptLibraryService],
})
export class PromptLibraryModule {}
