export enum NodeStatus {
  MASTERED = 'MASTERED',
  DOUBT = 'DOUBT',
  VISITED = 'VISITED',
  UNVISITED = 'UNVISITED',
}

export interface GraphNodeDto {
  id: string;
  label: string;
  slug: string;
  status: NodeStatus;
  confidence: number;
  source: string;
  navigationContext?: {
    pageNumber?: number;
    sectionId?: string;
    quote?: string;
  };
  createdAt: string;
  history?: Array<{
    timestamp: string;
    status: NodeStatus;
    confidence: number;
  }>;
  annotationCount?: number;
}

export interface GraphEdgeDto {
  id: string;
  from: string;
  to: string;
  type: string;
  confidence: number;
  label?: string;
}

export class GraphVisualizationDto {
  nodes: GraphNodeDto[];
  edges: GraphEdgeDto[];
  metadata: {
    baselineGraphId: string;
    learnerGraphId: string;
    totalNodes: number;
    totalEdges: number;
    masteredCount: number;
    doubtCount: number;
    visitedCount: number;
    unvisitedCount: number;
  };
}
