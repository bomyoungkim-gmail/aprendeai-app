export class NodeChangeDto {
  nodeId: string;
  label: string;
  confidence?: number;
  confidenceDelta?: number;
  previousConfidence?: number;
  newConfidence?: number;
  reason?: string;
  timestamp: Date;
}

export class GraphDiffSummaryDto {
  nodesAdded: number;
  nodesRemoved: number;
  nodesStrengthened: number;
  nodesWeakened: number;
}

export class GraphDiffResponseDto {
  period: {
    from: Date;
    to: Date;
  };
  summary: GraphDiffSummaryDto;
  changes: {
    added: NodeChangeDto[];
    removed: NodeChangeDto[];
    strengthened: NodeChangeDto[];
    weakened: NodeChangeDto[];
  };
}
