import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { AIQuestionGeneratorService } from "./ai-question-generator.service";
import { CreateQuestionBankDto, SourceType } from "../dto/question-bank.dto";
import { GenerateQuestionsDto } from "../dto/generate-questions.dto";
import { ItemBankService } from "../../item-bank/item-bank.service";
import { Language, ItemType, ScopeType, ItemVisibility } from "@prisma/client";
import * as crypto from "crypto";

@Injectable()
export class QuestionSelectionService {
  private readonly logger = new Logger(QuestionSelectionService.name);

  constructor(
    private prisma: PrismaService,
    private aiGenerator: AIQuestionGeneratorService,
    private itemBankService: ItemBankService,
  ) {}

  async getQuestionsForUser(
    params: GenerateQuestionsDto,
    context?: {
      userId?: string;
      institutionId?: string;
      familyId?: string;
    }
  ) {
    const {
      gameType,
      topic,
      subject,
      educationLevel,
      count,
      language = "pt-BR",
    } = params;
    const questions = [];

    // 1. Fetch from ItemBank with scope filtering
    const langEnum = this.mapLanguage(language);
    
    // Determine scope for query
    const { scopeType, scopeId } = this.determineScopeFromContext(context);
    
    const items = await this.itemBankService.findAll({
      tags: [gameType, subject, topic],
      language: langEnum,
      limit: count,
      tagsMatchMode: 'every',
      // Security: Filter by scope
      scopeType,  // ✅ camelCase
      scopeId,    // ✅ camelCase
      includePublic: true,  // ✅ camelCase
    });

    const dbQuestions = items.map(item => this.mapItemToLegacy(item));

    questions.push(...dbQuestions);

    // 2. If not enough questions, generate via AI
    if (questions.length < count) {
      const remainingCount = count - questions.length;
      this.logger.log(
        `Not enough questions in DB (${questions.length}/${count}). Generating ${remainingCount} via AI...`,
      );

      try {
        const generatedQuestions = await this.aiGenerator.generate({
          ...params,
          count: remainingCount,
          language,
        });

        // 3. Save generated questions to DB for future use
        for (const q of generatedQuestions) {
          const saved = await this.saveGeneratedQuestion(
            {
              gameType,
              subject,
              topic,
              educationLevel,
              language,
              difficulty: 3, // Default difficulty
              question: q.question,
              answer: q.answer,
              sourceType: SourceType.AI_GENERATED,
              metadata: { generatedAt: new Date() },
            },
            context  // Pass context for scope
          );
          questions.push(saved);
        }
      } catch (error) {
        this.logger.error("Failed to generate AI questions fallback:", error);
        // If AI fails, return what we have (even if fewer)
      }
    }

    // Shuffle results before returning
    return questions.sort(() => Math.random() - 0.5).slice(0, count);
  }

  private async saveGeneratedQuestion(
    dto: CreateQuestionBankDto,
    context?: {
      userId?: string;
      institutionId?: string;
      familyId?: string;
    }
  ) {
    const type = this.mapGameTypeToItemType(dto.gameType);
    const text = this.extractTextFromQuestion(dto.question);
    const options = this.extractOptionsFromQuestion(dto.question);
    
    // Determine scope and visibility for new item
    const { scopeType, scopeId } = this.determineScopeFromContext(context);
    const visibility = this.determineVisibility(scopeType, context);
    
    const created = await this.itemBankService.createItem({
      type,
      text,
      options,
      correct_answer: dto.answer,
      language: this.mapLanguage(dto.language),
      difficulty: (dto.difficulty || 3) / 5,
      tags: [dto.gameType, dto.subject, dto.topic],
      metadata: {
         legacy_payload: dto.question,
         education_level: dto.educationLevel,
         source_type: dto.sourceType,
         generated_at: new Date()
      },
      // Security: Set scope and visibility
      scopeType,  // ✅ camelCase
      scopeId,    // ✅ camelCase
      visibility,
      createdBy: context?.userId,  // ✅ camelCase
    });

    return this.mapItemToLegacy(created as any);
  }

  /**
   * Determine scope from user context
   */
  private determineScopeFromContext(context?: {
    userId?: string;
    institutionId?: string;
    familyId?: string;
  }): { scopeType: ScopeType; scopeId?: string } {
    if (!context) {
      return { scopeType: ScopeType.GLOBAL, scopeId: undefined };
    }

    // Priority: INSTITUTION > FAMILY > USER
    if (context.institutionId) {
      return { scopeType: ScopeType.INSTITUTION, scopeId: context.institutionId };
    }
    
    if (context.familyId) {
      return { scopeType: ScopeType.FAMILY, scopeId: context.familyId };
    }
    
    if (context.userId) {
      return { scopeType: ScopeType.USER, scopeId: context.userId };
    }

    return { scopeType: ScopeType.GLOBAL, scopeId: undefined };
  }

  /**
   * Determine visibility based on scope
   */
  private determineVisibility(
    scopeType: ScopeType,
    context?: { userId?: string; institutionId?: string; familyId?: string }
  ): ItemVisibility {
    // Institution items are visible to all members
    if (scopeType === ScopeType.INSTITUTION) {
      return ItemVisibility.INSTITUTION;
    }
    
    // Family and user items are private by default
    if (scopeType === ScopeType.FAMILY || scopeType === ScopeType.USER) {
      return ItemVisibility.PRIVATE;
    }
    
    // Global items are public
    return ItemVisibility.PUBLIC;
  }

  private mapLanguage(lang: string): Language {
      if (lang.toLowerCase().startsWith('en')) return Language.EN;
      if (lang.toLowerCase().startsWith('ko')) return Language.KO;
      return Language.PT_BR;
  }

  private mapGameTypeToItemType(gameType: string): ItemType {
      if (gameType === 'CONCEPT_LINKING') return ItemType.OPEN_ENDED;
      if (gameType === 'SRS_ARENA') return ItemType.OPEN_ENDED; // Flashcard
      if (gameType === 'FREE_RECALL_SCORE') return ItemType.OPEN_ENDED;
      return ItemType.MULTIPLE_CHOICE;
  }

  private extractTextFromQuestion(q: any): string {
      if (q.targetWord) return `Describe "${q.targetWord}"`;
      if (q.question) return q.question;
      if (q.prompt) return q.prompt;
      return "Question Text";
  }

  private extractOptionsFromQuestion(q: any): any {
      if (q.forbiddenWords) return { forbiddenWords: q.forbiddenWords };
      return undefined;
  }

  private mapItemToLegacy(item: any) {
      // Reconstruct legacy structure
      // Prefer legacy_payload from metadata if available
      let questionPayload = item.metadata?.legacy_payload;
      
      if (!questionPayload) {
         // Fallback reconstruction
         if (item.options?.forbiddenWords) {
             // Taboo
             const match = item.text.match(/Describe "(.*)"/);
             const targetWord = match ? match[1] : "Unknown";
             questionPayload = { targetWord, forbiddenWords: item.options.forbiddenWords };
         } else {
             questionPayload = { question: item.text };
         }
      }

      return {
          id: item.legacy_id || item.id,
          game_type: item.tags?.find(t => ['CONCEPT_LINKING', 'SRS_ARENA', 'FREE_RECALL_SCORE'].includes(t)) || 'UNKNOWN',
          subject: item.tags?.[1] || 'General',
          topic: item.tags?.[2] || 'General',
          difficulty: Math.round((item.difficulty || 0.5) * 5),
          education_level: item.metadata?.education_level || 'medio',
          language: item.language === Language.PT_BR ? 'pt-BR' : item.language.toLowerCase(),
          question: questionPayload,
          answer: item.correct_answer,
          source_type: item.metadata?.source_type || 'AI_GENERATED',
          metadata: item.metadata,
          updated_at: item.updated_at
      };
  }
}
