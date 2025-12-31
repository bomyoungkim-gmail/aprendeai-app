import { ReadingSession, SessionEvent } from "./reading-session.entity";

export interface ISessionsRepository {
  create(data: Partial<ReadingSession>): Promise<ReadingSession>;
  findById(id: string): Promise<ReadingSession | null>;
  update(id: string, data: Partial<ReadingSession>): Promise<ReadingSession>;
  addEvent(sessionId: string, event: Partial<SessionEvent>): Promise<SessionEvent>;
  findEvents(sessionId: string): Promise<SessionEvent[]>;
  
  // For queries
  findMany(params: {
    where?: any;
    skip?: number;
    take?: number;
    orderBy?: any;
  }): Promise<ReadingSession[]>;
  count(params: { where?: any }): Promise<number>;
  findReadContentIds(userId: string): Promise<string[]>;
}

export const ISessionsRepository = Symbol("ISessionsRepository");
