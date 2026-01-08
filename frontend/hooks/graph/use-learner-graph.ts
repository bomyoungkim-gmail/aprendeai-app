import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export interface GraphNode {
  id: string;
  label: string;
  slug: string;
  status: 'MASTERED' | 'DOUBT' | 'VISITED' | 'UNVISITED';
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
    status: 'MASTERED' | 'DOUBT' | 'VISITED' | 'UNVISITED';
    confidence: number;
  }>;
  annotationCount?: number;
}

export interface GraphEdge {
  id: string;
  from: string;
  to: string;
  type: string;
  confidence: number;
  label?: string;
}

export interface GraphVisualization {
  nodes: GraphNode[];
  edges: GraphEdge[];
  metadata: {
    baselineGraphId: string | null;
    learnerGraphId: string | null;
    totalNodes: number;
    totalEdges: number;
    masteredCount: number;
    doubtCount: number;
    visitedCount: number;
    unvisitedCount: number;
  };
}

export function useLearnerGraph(contentId: string) {
  return useQuery<GraphVisualization>({
    queryKey: ['learner-graph', contentId],
    queryFn: async () => {
      const response = await api.get(`/graph/learner?contentId=${contentId}`);
      return response.data;
    },
    enabled: !!contentId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
