/**
 * SCRIPT 07: Telemetry & KPIs - Response DTOs
 *
 * Metrics for measuring Syntax Analyzer usage and Scaffolding Fading effectiveness.
 */

export class SyntaxUsageRateDto {
  /**
   * Percentage of sessions that used syntax analysis (0-100)
   */
  percentage: number;

  /**
   * Number of sessions with at least one syntax analysis
   */
  sessionsWithSyntax: number;

  /**
   * Total number of sessions in the period
   */
  totalSessions: number;
}

export class SummaryImprovementDto {
  /**
   * Average summary length for users who used syntax analyzer
   */
  avgLengthWithSyntax: number;

  /**
   * Average summary length for users who didn't use syntax analyzer
   */
  avgLengthWithoutSyntax: number;

  /**
   * Improvement in summary length (positive = better)
   */
  lengthImprovement: number;

  /**
   * Proposition density (connectors per 100 words) for users with syntax
   */
  propositionDensityWithSyntax: number;

  /**
   * Proposition density (connectors per 100 words) for users without syntax
   */
  propositionDensityWithoutSyntax: number;
}

export class WritingClarityDto {
  /**
   * Average confidence score from syntax analysis events
   */
  avgSyntaxConfidence: number;

  /**
   * Average sentence length for users who used syntax analyzer
   */
  avgSentenceLengthWithSyntax: number;

  /**
   * Average sentence length for users who didn't use syntax analyzer
   */
  avgSentenceLengthWithoutSyntax: number;

  /**
   * Connector density (connectors per sentence) for users with syntax
   */
  connectorDensityWithSyntax: number;

  /**
   * Connector density (connectors per sentence) for users without syntax
   */
  connectorDensityWithoutSyntax: number;
}

export class FadingHealthByModeDto {
  /**
   * Content mode (NARRATIVE, DIDACTIC, TECHNICAL, etc.)
   */
  mode: string;

  /**
   * Average days to fade from higher to lower scaffolding level
   */
  avgDaysToFade: number;

  /**
   * Number of fading events observed
   */
  fadeCount: number;
}

export class FadingHealthDto {
  /**
   * Fading health metrics grouped by content mode
   */
  byMode: FadingHealthByModeDto[];
}

export class CheckpointCorrelationDto {
  /**
   * Metrics for users who used syntax analyzer
   */
  withSyntax: {
    avgScore: number;
    userCount: number;
  };

  /**
   * Metrics for users who didn't use syntax analyzer
   */
  withoutSyntax: {
    avgScore: number;
    userCount: number;
  };

  /**
   * Improvement in checkpoint scores (positive = better)
   */
  improvement: number;
}

/**
 * SCRIPT 07: Complete metrics response
 */
export class Script07MetricsDto {
  /**
   * Syntax analyzer usage rate
   */
  syntaxUsageRate: SyntaxUsageRateDto;

  /**
   * Summary quality improvement metrics
   */
  summaryImprovement: SummaryImprovementDto;

  /**
   * Writing clarity improvement metrics
   */
  writingClarity: WritingClarityDto;

  /**
   * Scaffolding fading health metrics
   */
  fadingHealth: FadingHealthDto;

  /**
   * Correlation between syntax usage and checkpoint performance
   */
  checkpointCorrelation: CheckpointCorrelationDto;
}
