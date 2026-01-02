import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import {
  IEventRepository,
  IDomainEvent,
} from "../../domain/interfaces/event.repository.interface";

@Injectable()
export class PrismaEventRepository implements IEventRepository {
  constructor(private readonly prisma: PrismaService) {}

  async persist(event: IDomainEvent): Promise<void> {
    await this.prisma.session_events.create({
      data: {
        id: event.id,
        reading_session_id: event.sessionId,
        event_type: event.type as any,
        payload_json: event.payload as any,
        created_at: event.createdAt,
      },
    });
  }

  async getSessionEvents(
    sessionId: string,
    domain?: string,
  ): Promise<IDomainEvent[]> {
    const where: any = { reading_session_id: sessionId };
    if (domain) {
      where.payload_json = {
        path: ["domain"],
        equals: domain,
      };
    }

    const events = await this.prisma.session_events.findMany({
      where,
      orderBy: { created_at: "asc" },
    });

    return events.map(this.mapToEntity);
  }

  async getHouseholdEvents(
    householdId: string,
    limit = 100,
  ): Promise<IDomainEvent[]> {
    const events = await this.prisma.session_events.findMany({
      where: {
        payload_json: {
          path: ["data", "householdId"],
          equals: householdId,
        },
      },
      orderBy: { created_at: "desc" },
      take: limit,
    });

    return events.map(this.mapToEntity);
  }

  async getClassroomEvents(
    classroomId: string,
    limit = 100,
  ): Promise<IDomainEvent[]> {
    const events = await this.prisma.session_events.findMany({
      where: {
        payload_json: {
          path: ["data", "classroomId"],
          equals: classroomId,
        },
      },
      orderBy: { created_at: "desc" },
      take: limit,
    });

    return events.map(this.mapToEntity);
  }

  async getStudentEvents(
    learnerUserId: string,
    limit = 50,
  ): Promise<IDomainEvent[]> {
    const events = await this.prisma.session_events.findMany({
      where: {
        payload_json: {
          path: ["data", "learnerUserId"],
          equals: learnerUserId,
        },
      },
      orderBy: { created_at: "desc" },
      take: limit,
    });

    return events.map(this.mapToEntity);
  }

  private mapToEntity(e: any): IDomainEvent {
    return {
      id: e.id,
      type: e.event_type,
      sessionId: e.reading_session_id,
      payload: e.payload_json,
      createdAt: e.created_at,
    };
  }
}
