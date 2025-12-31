import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import * as crypto from "crypto";
import { QueueService } from "./queue.service";
import { NotificationsGateway } from "../notifications/notifications.gateway";
import { PrismaService } from "../prisma/prisma.service";
import { AIContentService } from "../common/services/ai-content.service";
import { Language, QuestionType } from "@prisma/client";
import * as amqp from "amqplib";

interface ContentProcessMessage {
  action: "SIMPLIFY" | "ASSESSMENT";
  contentId: string;
  text: string;
  level?: string;
  targetLang?: string;
}

@Injectable()
export class QueueConsumerService implements OnModuleInit {
  private readonly logger = new Logger(QueueConsumerService.name);
  private channel: amqp.Channel | null = null;

  constructor(
    private queueService: QueueService,
    private prisma: PrismaService,
    private aiContentService: AIContentService,
    private notificationsGateway: NotificationsGateway,
  ) {}

  async onModuleInit() {
    // Start consuming after a short delay to ensure RabbitMQ is connected
    setTimeout(() => this.startConsuming(), 2000);
  }

  private async startConsuming() {
    try {
      const queueServiceInternal = this.queueService as any;

      if (!queueServiceInternal.channel) {
        this.logger.warn("RabbitMQ channel not available, consumer disabled");
        return;
      }

      this.channel = queueServiceInternal.channel;
      const queue = "content.process";

      await this.channel.assertQueue(queue, { durable: true });
      await this.channel.prefetch(1);

      this.logger.log(`🎧 Listening for messages on queue: ${queue}`);

      this.channel.consume(
        queue,
        async (msg) => {
          if (!msg) return;

          try {
            const content = JSON.parse(
              msg.content.toString(),
            ) as ContentProcessMessage;
            this.logger.log(
              `📥 Processing ${content.action} for content ${content.contentId}`,
            );

            await this.processMessage(content);

            this.channel?.ack(msg);
          } catch (error) {
            this.logger.error(
              `❌ Error processing message: ${error.message}`,
              error.stack,
            );
            this.channel?.nack(msg, false, true);
          }
        },
        { noAck: false },
      );
    } catch (error) {
      this.logger.error(`Failed to start consumer: ${error.message}`);
    }
  }

  private async processMessage(message: ContentProcessMessage) {
    const { action, contentId, text, level, targetLang } = message;

    try {
      if (action === "SIMPLIFY") {
        await this.handleSimplification(contentId, text, level, targetLang);
      } else if (action === "ASSESSMENT") {
        await this.handleAssessment(contentId, text, level);
      }

      this.logger.log(`✅ Completed ${action} for content ${contentId}`);
    } catch (error) {
      this.logger.error(
        `Failed to process ${action}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  private async handleSimplification(
    contentId: string,
    text: string,
    level?: string,
    targetLang?: string,
  ) {
    this.logger.log(
      `Simplifying content ${contentId} to level ${level} using Gemini AI`,
    );

    const lang: Language = (targetLang as Language) || Language.PT_BR;
    const schoolingLevel = level || "5_EF";

    try {
      // Call generic AI content service
      const result = await this.aiContentService.simplifyText({
        text,
        targetLevel: schoolingLevel,
        targetLanguage: lang,
      });

      await this.prisma.content_versions.create({
        data: {
          id: crypto.randomUUID(),
          content_id: contentId,
          target_language: lang,
          schooling_level_target: schoolingLevel,
          simplified_text: result.simplifiedText,
          summary: result.summary,
        },
      });

      this.logger.log(
        `✅ Saved AI-simplified version for content ${contentId}`,
      );
    } catch (error) {
      this.logger.error(`AI simplification failed: ${error.message}`);

      if (error.message === "QUOTA_EXCEEDED") {
        this.notificationsGateway.emitContentError(
          contentId,
          "simplification",
          "QUOTA_EXCEEDED",
          "Cota de IA excedida. Tente novamente mais tarde.",
        );
        return; // Don't save fallback if quota exceeded? Or maybe user wants fallback?
        // Let's assume we want fallback for simplification, but notify about basic quality.
        // Actually, if using fallback, it's strictly a "Success" but with "Fallback" quality.
        // But user asked to know if "insufficient credit".
        // Let's emit warning if fallback is used.
      }

      this.logger.warn(
        `Using fallback simplification for content ${contentId}`,
      );

      // Emit warning/error so UI knows it was fallback
      this.notificationsGateway.emitContentError(
        contentId,
        "simplification",
        "AI_FALLBACK",
        "Simplificação gerada sem IA devido a erro no serviço.",
      );

      // Fallback to simple truncation
      const simplifiedText = `[Simplificado (Modo Offline) para ${schoolingLevel}]\n\n${text.substring(0, 500)}...`;
      const summary = `Resumo automático (Offline): ${text.substring(0, 100)}...`;

      await this.prisma.content_versions.create({
        data: {
          id: crypto.randomUUID(),
          content_id: contentId,
          target_language: lang,
          schooling_level_target: schoolingLevel,
          simplified_text: simplifiedText,
          summary,
        },
      });

      // Also emit success because we DID create a version
      this.notificationsGateway.emitContentUpdate(contentId, "simplification");
    }
  }

  private async handleAssessment(
    contentId: string,
    text: string,
    level?: string,
  ) {
    this.logger.log(
      `Generating assessment for content ${contentId} using Gemini AI`,
    );
    const schoolingLevel = level || "1_EM";

    try {
      // Call generic AI content service
      const result = await this.aiContentService.generateAssessment({
        text,
        level: schoolingLevel,
        questionCount: 5,
      });

      const questionsToCreate = result.questions.map((q) => ({
        id: crypto.randomUUID(),
        question_text: q.questionText,
        question_type: this.mapQuestionType(q.questionType),
        options: q.options || [],
        correct_answer: q.correctAnswer,
      }));

      await this.prisma.assessments.create({
        data: {
          id: crypto.randomUUID(),
          contents: { connect: { id: contentId } },
          schooling_level_target: schoolingLevel,
          updated_at: new Date(),
          assessment_questions: {
            create: questionsToCreate,
          },
        },
      });

      this.logger.log(
        `✅ Created AI-generated assessment for content ${contentId}`,
      );

      // Success Notification
      this.notificationsGateway.emitContentUpdate(contentId, "assessment");
    } catch (error) {
      this.logger.error(`AI assessment generation failed: ${error.message}`);

      if (error.message === "QUOTA_EXCEEDED") {
        this.notificationsGateway.emitContentError(
          contentId,
          "assessment",
          "QUOTA_EXCEEDED",
          "Não foi possível gerar a avaliação: Limite de cota da IA excedido.",
        );
      } else {
        this.notificationsGateway.emitContentError(
          contentId,
          "assessment",
          "AI_ERROR",
          "Erro ao gerar avaliação com IA. Tente novamente.",
        );
      }

      throw error; // Rethrow to keep message in queue (optional, or ack and fail)
    }
  }

  private mapQuestionType(type: string): QuestionType {
    if (type === "MULTIPLE_CHOICE") return QuestionType.MULTIPLE_CHOICE;
    if (type === "TRUE_FALSE") return QuestionType.TRUE_FALSE;
    return QuestionType.SHORT_ANSWER;
  }
}
