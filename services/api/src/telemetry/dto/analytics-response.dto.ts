import { ApiProperty } from "@nestjs/swagger";

export class SessionMetricsDto {
  @ApiProperty()
  sessionId: string;

  @ApiProperty()
  totalTimeMs: number;

  @ApiProperty()
  scrollDepth: number;

  @ApiProperty()
  highlightsCount: number;

  @ApiProperty()
  notesCount: number;

  @ApiProperty()
  dominantMode: string;

  @ApiProperty()
  startTime: Date;

  @ApiProperty()
  endTime: Date;

  @ApiProperty({ required: false })
  comprehensionScore?: number;

  @ApiProperty({ required: false })
  productionScore?: number;

  @ApiProperty({ required: false })
  frustrationIndex?: number;
}

export class DailyEngagementDto {
  @ApiProperty()
  date: string; // YYYY-MM-DD

  @ApiProperty()
  totalTimeMs: number;

  @ApiProperty()
  contentsRead: number;

  @ApiProperty()
  sessionsCount: number;
}

export class GlobalStatsDto {
  @ApiProperty()
  activeUsers: number;

  @ApiProperty()
  contentsRead: number;

  @ApiProperty()
  completionRate: number;

  @ApiProperty()
  avgTime: number;

  @ApiProperty({ type: "object", additionalProperties: { type: "number" } })
  modeUsage: Record<string, number>;

  @ApiProperty({ type: "array", items: { type: "object" } })
  confusionHeatmap: Array<{ sectionId: string; count: number }>;
}
