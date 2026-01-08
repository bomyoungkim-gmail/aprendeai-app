'use client';

import React, { useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import type { GraphNode, GraphEdge } from '@/hooks/graph/use-learner-graph';

// Lazy load 3D component
const ForceGraph3D = dynamic(() => import('react-force-graph-3d'), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
    </div>
  ),
});

interface LearnerGraph3DProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  onNodeClick?: (node: GraphNode) => void;
}

const STATUS_COLORS = {
  MASTERED: '#10b981',
  DOUBT: '#ef4444',
  VISITED: '#3b82f6',
  UNVISITED: '#9ca3af',
};

export function LearnerGraph3D({ nodes, edges, onNodeClick }: LearnerGraph3DProps) {
  const graphData = useMemo(() => {
    return {
      nodes: nodes.map(node => ({
        id: node.id,
        name: node.label,
        val: node.confidence * 10, // Node size based on confidence
        color: STATUS_COLORS[node.status as keyof typeof STATUS_COLORS],
        __data: node, // Store original data
      })),
      links: edges.map(edge => ({
        source: edge.from,
        target: edge.to,
        color: edge.type === 'PREREQUISITE' ? '#ef4444' : '#6b7280',
      })),
    };
  }, [nodes, edges]);

  const handleNodeClick = useCallback((node: any) => {
    if (node.__data && onNodeClick) {
      onNodeClick(node.__data);
    }
  }, [onNodeClick]);

  return (
    <div className="h-full w-full">
      <ForceGraph3D
        graphData={graphData}
        nodeLabel={(node: any) => `
          <div style="background: white; padding: 12px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); font-family: system-ui;">
            <div style="font-weight: 600; font-size: 14px; margin-bottom: 8px; color: #1f2937;">${node.name}</div>
            <div style="font-size: 12px; color: #6b7280; line-height: 1.5;">
              <div><strong>Status:</strong> ${
                node.__data.status === 'MASTERED' ? '✓ Dominado' :
                node.__data.status === 'DOUBT' ? '? Dúvida' :
                node.__data.status === 'VISITED' ? '○ Visitado' :
                '· Não visitado'
              }</div>
              <div><strong>Confiança:</strong> ${Math.round(node.__data.confidence * 100)}%</div>
              ${node.__data.annotationCount > 0 ? `<div><strong>Notas:</strong> ${node.__data.annotationCount}</div>` : ''}
            </div>
          </div>
        `}
        nodeAutoColorBy="color"
        linkDirectionalParticles={2}
        linkDirectionalParticleSpeed={0.005}
        onNodeClick={handleNodeClick}
        backgroundColor="#f9fafb"
      />
    </div>
  );
}
