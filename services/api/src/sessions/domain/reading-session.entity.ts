import { SessionPhase, SessionModality, AssetLayer } from "@prisma/client";

export class ReadingSession {
  id: string;
  userId: string;
  contentId: string;
  contentVersionId?: string;
  phase: SessionPhase;
  modality: SessionModality;
  assetLayer: AssetLayer;
  startTime: Date; // mapped from started_at
  finishedAt?: Date;
  goalStatement?: string;
  predictionText?: string;
  targetWordsJson?: any;
  createdAt: Date;
  updatedAt: Date;

  // Relations (optional/partial for aggregates)
  events?: SessionEvent[];
  outcomes?: SessionOutcome[];
  content?: {
    id: string;
    title: string;
    type: string;
    originalLanguage?: string;
  };

  constructor(partial: Partial<ReadingSession>) {
    Object.assign(this, partial);
  }

  isFinished(): boolean {
    return this.phase === "FINISHED";
  }
}

export class SessionEvent {
  id: string;
  sessionId: string;
  eventType: string;
  payload: any;
  createdAt: Date;
}

export class SessionOutcome {
  sessionId: string;
  comprehensionScore: number;
  productionScore: number;
  frustrationIndex: number;
}
