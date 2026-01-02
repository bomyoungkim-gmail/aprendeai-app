import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { ISessionsRepository } from "../../domain/sessions.repository.interface";
import {
  ReadingSession,
  SessionEvent,
} from "../../domain/reading-session.entity";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class PrismaSessionsRepository implements ISessionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Partial<ReadingSession>): Promise<ReadingSession> {
    const created = await this.prisma.reading_sessions.create({
      data: {
        id: data.id || uuidv4(),
        user_id: data.userId!,
        content_id: data.contentId!,
        phase: data.phase || "PRE",
        modality: data.modality || "READING",
        asset_layer: data.assetLayer!,
        target_words_json: data.targetWordsJson,
        content_version_id: data.contentVersionId, // Ensure it's passed
        started_at: data.startTime || new Date(),
      },
      include: { contents: true },
    });
    return this.mapToDomain(created);
  }

  async findById(id: string): Promise<ReadingSession | null> {
    const found = await this.prisma.reading_sessions.findUnique({
      where: { id },
      include: {
        contents: {
          select: {
            id: true,
            title: true,
            type: true,
            original_language: true,
          },
        },
        session_events: { orderBy: { created_at: "asc" } },
      },
    });
    return found ? this.mapToDomain(found) : null;
  }

  async update(
    id: string,
    data: Partial<ReadingSession>,
  ): Promise<ReadingSession> {
    const updated = await this.prisma.reading_sessions.update({
      where: { id },
      data: {
        phase: data.phase,
        finished_at: data.finishedAt,
        goal_statement: data.goalStatement,
        prediction_text: data.predictionText,
        target_words_json: data.targetWordsJson,
      },
      include: { contents: true },
    });
    return this.mapToDomain(updated);
  }

  async addEvent(
    sessionId: string,
    event: Partial<SessionEvent>,
  ): Promise<SessionEvent> {
    const created = await this.prisma.session_events.create({
      data: {
        id: uuidv4(),
        reading_session_id: sessionId,
        event_type: event.eventType as any,
        payload_json: event.payload ?? {},
      },
    });
    return {
      id: created.id,
      sessionId: created.reading_session_id,
      eventType: created.event_type,
      payload: created.payload_json,
      createdAt: created.created_at,
    };
  }

  async findEvents(sessionId: string): Promise<SessionEvent[]> {
    const events = await this.prisma.session_events.findMany({
      where: { reading_session_id: sessionId },
      orderBy: { created_at: "asc" },
    });
    return events.map((e) => ({
      id: e.id,
      sessionId: e.reading_session_id,
      eventType: e.event_type,
      payload: e.payload_json,
      createdAt: e.created_at,
    }));
  }

  async findMany(params: any): Promise<ReadingSession[]> {
    const found = await this.prisma.reading_sessions.findMany({
      ...params,
      include: {
        contents: {
          select: {
            id: true,
            title: true,
            type: true,
            original_language: true,
          },
        },
      },
    });
    return found.map(this.mapToDomain);
  }

  async count(params: any): Promise<number> {
    return this.prisma.reading_sessions.count(params);
  }

  async findReadContentIds(userId: string): Promise<string[]> {
    const found = await this.prisma.reading_sessions.findMany({
      where: { user_id: userId },
      select: { content_id: true },
      distinct: ["content_id"],
    });
    return found.map((f) => f.content_id);
  }

  private mapToDomain(prismaSession: any): ReadingSession {
    return new ReadingSession({
      id: prismaSession.id,
      userId: prismaSession.user_id,
      contentId: prismaSession.content_id,
      contentVersionId: prismaSession.content_version_id,
      phase: prismaSession.phase,
      modality: prismaSession.modality,
      assetLayer: prismaSession.asset_layer,
      startTime: prismaSession.started_at,
      finishedAt: prismaSession.finished_at,
      goalStatement: prismaSession.goal_statement,
      predictionText: prismaSession.prediction_text,
      targetWordsJson: prismaSession.target_words_json,
      createdAt: prismaSession.created_at,
      updatedAt: prismaSession.updated_at,
      content: prismaSession.contents
        ? {
            id: prismaSession.contents.id,
            title: prismaSession.contents.title,
            type: prismaSession.contents.type,
            originalLanguage: prismaSession.contents.original_language,
          }
        : undefined,
      events: prismaSession.session_events?.map((e: any) => ({
        id: e.id,
        sessionId: e.reading_session_id,
        eventType: e.event_type,
        payload: e.payload_json,
        createdAt: e.created_at,
      })),
    });
  }
}
