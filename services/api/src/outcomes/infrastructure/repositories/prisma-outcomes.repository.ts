import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { IOutcomesRepository } from "../../domain/outcomes.repository.interface";
import { SessionOutcome } from "../../domain/session-outcome.entity";

@Injectable()
export class PrismaOutcomesRepository implements IOutcomesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async upsert(outcome: SessionOutcome): Promise<SessionOutcome> {
    const upserted = await this.prisma.session_outcomes.upsert({
      where: { reading_session_id: outcome.readingSessionId },
      create: {
        reading_session_id: outcome.readingSessionId,
        comprehension_score: outcome.comprehensionScore,
        production_score: outcome.productionScore,
        frustration_index: outcome.frustrationIndex,
        computed_at: outcome.computedAt,
      },
      update: {
        comprehension_score: outcome.comprehensionScore,
        production_score: outcome.productionScore,
        frustration_index: outcome.frustrationIndex,
        computed_at: outcome.computedAt,
      },
    });

    return this.mapToDomain(upserted);
  }

  async findBySessionId(sessionId: string): Promise<SessionOutcome | null> {
    const found = await this.prisma.session_outcomes.findUnique({
      where: { reading_session_id: sessionId },
    });

    return found ? this.mapToDomain(found) : null;
  }

  private mapToDomain(item: any): SessionOutcome {
    return new SessionOutcome({
      readingSessionId: item.reading_session_id,
      comprehensionScore: item.comprehension_score,
      productionScore: item.production_score,
      frustrationIndex: item.frustration_index,
      computedAt: item.computed_at,
    });
  }
}
