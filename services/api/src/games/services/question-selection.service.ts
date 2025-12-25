import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AIQuestionGeneratorService } from './ai-question-generator.service';
import { CreateQuestionBankDto, EducationLevel, SourceType } from '../dto/question-bank.dto';
import { GenerateQuestionsDto } from '../dto/generate-questions.dto';

@Injectable()
export class QuestionSelectionService {
  private readonly logger = new Logger(QuestionSelectionService.name);

  constructor(
    private prisma: PrismaService,
    private aiGenerator: AIQuestionGeneratorService
  ) {}

  async getQuestionsForUser(params: GenerateQuestionsDto) {
    const { gameType, topic, subject, educationLevel, count, language = 'pt-BR' } = params;
    const questions = [];

    // 1. Try to fetch from existing curated database first
    const dbQuestions = await this.prisma.questionBank.findMany({
      where: {
        gameType,
        subject,
        topic,
        educationLevel,
        language,
      },
      take: count,
      orderBy: {
        // Randomize visually (Prisma doesn't support RAND() natively easily, so we take sample and shuffle in memory)
        updatedAt: 'desc', 
      },
    });

    questions.push(...dbQuestions);

    // 2. If not enough questions, generate via AI
    if (questions.length < count) {
      const remainingCount = count - questions.length;
      this.logger.log(`Not enough questions in DB (${questions.length}/${count}). Generating ${remainingCount} via AI...`);

      try {
        const generatedQuestions = await this.aiGenerator.generate({
          ...params,
          count: remainingCount,
          language,
        });

        // 3. Save generated questions to DB for future use
        for (const q of generatedQuestions) {
          const saved = await this.saveGeneratedQuestion({
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
          });
          questions.push(saved);
        }
      } catch (error) {
        this.logger.error('Failed to generate AI questions fallback:', error);
        // If AI fails, return what we have (even if fewer)
      }
    }

    // Shuffle results before returning
    return questions.sort(() => Math.random() - 0.5).slice(0, count);
  }

  private async saveGeneratedQuestion(dto: CreateQuestionBankDto) {
    return this.prisma.questionBank.create({
      data: {
        gameType: dto.gameType,
        subject: dto.subject,
        topic: dto.topic,
        difficulty: dto.difficulty,
        educationLevel: dto.educationLevel,
        language: dto.language,
        question: dto.question,
        answer: dto.answer,
        sourceType: dto.sourceType,
        metadata: dto.metadata || {},
      },
    });
  }
}
