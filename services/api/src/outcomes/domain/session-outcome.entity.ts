export class SessionOutcome {
  readingSessionId: string;
  comprehensionScore: number;
  productionScore: number;
  frustrationIndex: number;
  computedAt: Date;

  constructor(partial: Partial<SessionOutcome>) {
    Object.assign(this, partial);
    this.comprehensionScore = partial.comprehensionScore ?? 0;
    this.productionScore = partial.productionScore ?? 0;
    this.frustrationIndex = partial.frustrationIndex ?? 0;
    this.computedAt = partial.computedAt || new Date();
  }
}
