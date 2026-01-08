'use client';

import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  OnNodesChange,
  OnEdgesChange,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';
import { toPng } from 'html-to-image';
import { useLearnerGraph, type GraphNode, type GraphEdge } from '@/hooks/graph/use-learner-graph';
import { 
  Loader2, Download, Search, X, Maximize2, Minimize2, Info,
  ChevronDown, ChevronUp, Play, Pause, SkipBack, SkipForward, Box
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { NodeDetailsSheet } from './NodeDetailsSheet';
import type { DecisionPolicyV1 } from '@/types/session';
import dynamic from 'next/dynamic';

// Lazy load 3D component
const LearnerGraph3D = dynamic(() => import('./LearnerGraph3D').then(mod => ({ default: mod.LearnerGraph3D })), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
    </div>
  ),
});

interface LearnerGraphProps {
  contentId: string;
  onNavigate?: (page: number, scrollPct?: number) => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  policy?: DecisionPolicyV1;
  userRole?: 'LEARNER' | 'EDUCATOR' | 'ADMIN' | 'PARENT';
}

const STATUS_COLORS = {
  MASTERED: '#10b981',
  DOUBT: '#ef4444',
  VISITED: '#3b82f6',
  UNVISITED: '#9ca3af',
};

type NodeStatus = keyof typeof STATUS_COLORS;

const getLayoutedElements = (nodes: Node[], edges: Edge[], isMobile: boolean = false) => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ 
    rankdir: 'TB', 
    nodesep: isMobile ? 60 : 80, 
    ranksep: isMobile ? 50 : 100 
  });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 180, height: 60 });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - 90,
        y: nodeWithPosition.y - 30,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};

export function LearnerGraph({ 
  contentId, 
  onNavigate,
  isFullscreen = false,
  onToggleFullscreen,
  policy,
  userRole
}: LearnerGraphProps) {
  const { data, isLoading, error } = useLearnerGraph(contentId);
  
  // Basic filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilters, setStatusFilters] = useState<Set<NodeStatus>>(
    new Set<NodeStatus>(['MASTERED', 'DOUBT', 'VISITED', 'UNVISITED'])
  );
  
  // Advanced filter states
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [edgeTypeFilters, setEdgeTypeFilters] = useState<Set<string>>(new Set());
  const [confidenceRange, setConfidenceRange] = useState<[number, number]>([0, 100]);
  
  // Path highlighting
  const [highlightedPath, setHighlightedPath] = useState<Set<string>>(new Set());
  const [highlightMode, setHighlightMode] = useState<'none' | 'upstream' | 'downstream'>('none');
  
  // Time-based visualization
  const [showTimeline, setShowTimeline] = useState(false);
  const [timelineDate, setTimelineDate] = useState<Date>(new Date());
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Node details
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  
  // 3D view
  const [is3DView, setIs3DView] = useState(false);
  
  // UI states
  const [showLegend, setShowLegend] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  
  // Refs
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Detect mobile
  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Timeline playback
  React.useEffect(() => {
    if (!isPlaying || !data) return;
    
    const interval = setInterval(() => {
      setTimelineDate(prev => {
        const next = new Date(prev);
        next.setDate(next.getDate() + 1);
        if (next > new Date()) {
          setIsPlaying(false);
          return prev;
        }
        return next;
      });
    }, 100); // 100ms per day (fast playback)
    
    return () => clearInterval(interval);
  }, [isPlaying, data]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Detect Mac vs Windows/Linux
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      // Ctrl/Cmd + F: Focus search
      if (modifier && e.key === 'f') {
        e.preventDefault();
        searchInputRef.current?.focus();
        toast.info('Busca ativada');
        return;
      }

      // Escape: Clear filters/search/selection
      if (e.key === 'Escape') {
        if (selectedNode) {
          setSelectedNode(null);
          toast.info('Detalhes fechados');
        } else if (highlightMode !== 'none') {
          setHighlightMode('none');
          setHighlightedPath(new Set());
          toast.info('Destaque limpo');
        } else if (searchQuery) {
          setSearchQuery('');
          toast.info('Busca limpa');
        }
        return;
      }

      // Ctrl/Cmd + E: Export
      if (modifier && e.key === 'e') {
        e.preventDefault();
        if (!is3DView) {
          downloadImage();
        }
        return;
      }

      // Ctrl/Cmd + L: Toggle legend
      if (modifier && e.key === 'l') {
        e.preventDefault();
        setShowLegend(prev => !prev);
        toast.info(showLegend ? 'Legenda oculta' : 'Legenda exibida');
        return;
      }

      // Ctrl/Cmd + T: Toggle timeline
      if (modifier && e.key === 't') {
        e.preventDefault();
        setShowTimeline(prev => !prev);
        toast.info(showTimeline ? 'Linha do tempo oculta' : 'Linha do tempo exibida');
        return;
      }

      // Ctrl/Cmd + 3: Toggle 3D view
      if (modifier && e.key === '3') {
        e.preventDefault();
        setIs3DView(prev => !prev);
        toast.info(is3DView ? 'Modo 2D' : 'Modo 3D');
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNode, highlightMode, searchQuery, showLegend, showTimeline, is3DView]);

  const toggleStatusFilter = useCallback((status: NodeStatus) => {
    setStatusFilters(prev => {
      const next = new Set(prev);
      if (next.has(status)) {
        next.delete(status);
      } else {
        next.add(status);
      }
      return next;
    });
  }, []);

  const toggleEdgeTypeFilter = useCallback((type: string) => {
    setEdgeTypeFilters(prev => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  }, []);

  const highlightPath = useCallback((nodeId: string, mode: 'upstream' | 'downstream') => {
    if (!data) return;
    
    const highlighted = new Set<string>();
    const visited = new Set<string>();
    const queue = [nodeId];
    
    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);
      highlighted.add(current);
      
      const relevantEdges = data.edges.filter(edge => 
        mode === 'upstream' 
          ? edge.to === current && edge.type === 'PREREQUISITE'
          : edge.from === current
      );
      
      relevantEdges.forEach(edge => {
        const nextNode = mode === 'upstream' ? edge.from : edge.to;
        highlighted.add(edge.id);
        if (!visited.has(nextNode)) {
          queue.push(nextNode);
        }
      });
    }
    
    setHighlightedPath(highlighted);
    setHighlightMode(mode);
  }, [data]);

  const clearHighlight = useCallback(() => {
    setHighlightedPath(new Set());
    setHighlightMode('none');
  }, []);

  const handleNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    const graphNode = data?.nodes.find(n => n.id === node.id);
    if (!graphNode) return;

    // Check for Shift key for path highlighting
    if (event.shiftKey) {
      if (highlightMode === 'none') {
        highlightPath(node.id, 'upstream');
      } else if (highlightMode === 'upstream') {
        highlightPath(node.id, 'downstream');
      } else {
        clearHighlight();
      }
      return;
    }

    const nav = graphNode.navigationContext;
    if (nav?.pageNumber) {
      onNavigate?.(nav.pageNumber);
      toast.info(`Navegando para página ${nav.pageNumber}`);
    } else {
      toast.info(`Tópico: ${graphNode.label}`, {
        description: 'Localização não disponível'
      });
    }
  }, [data, onNavigate, highlightMode, highlightPath, clearHighlight]);

  const handleNodeRightClick = useCallback((event: React.MouseEvent, node: Node) => {
    event.preventDefault();
    const graphNode = data?.nodes.find(n => n.id === node.id);
    if (graphNode) {
      setSelectedNode(graphNode);
    }
  }, [data]);

  const downloadImage = useCallback(async () => {
    const viewport = document.querySelector('.react-flow__viewport') as HTMLElement;
    if (!viewport) return;

    try {
      toast.info('Gerando imagem...');
      const dataUrl = await toPng(viewport, {
        backgroundColor: '#f9fafb',
        width: viewport.scrollWidth,
        height: viewport.scrollHeight,
      });
      
      const link = document.createElement('a');
      link.download = `grafo-conhecimento-${contentId}.png`;
      link.href = dataUrl;
      link.click();
      toast.success('Imagem baixada!');
    } catch (err) {
      console.error('Failed to export image:', err);
      toast.error('Erro ao exportar imagem');
    }
  }, [contentId]);

  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    if (!data) return { nodes: [], edges: [] };

    // Get all unique edge types
    const allEdgeTypes = new Set(data.edges.map(e => e.type));
    if (edgeTypeFilters.size === 0 && allEdgeTypes.size > 0) {
      setEdgeTypeFilters(new Set(allEdgeTypes));
    }

    // Filter nodes
    const filteredNodes = data.nodes.filter(node => {
      // Status filter
      const matchesStatus = statusFilters.has(node.status as NodeStatus);
      
      // Search filter
      const matchesSearch = !searchQuery || 
        node.label.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Confidence filter
      const matchesConfidence = node.confidence * 100 >= confidenceRange[0] && 
                                node.confidence * 100 <= confidenceRange[1];
      
      // Timeline filter
      const matchesTimeline = !showTimeline || 
        new Date(node.createdAt) <= timelineDate;
      
      return matchesStatus && matchesSearch && matchesConfidence && matchesTimeline;
    });

    const filteredNodeIds = new Set(filteredNodes.map(n => n.id));

    const nodes: Node[] = filteredNodes.map((node: GraphNode) => {
      const isHighlighted = highlightedPath.has(node.id);
      const opacity = highlightMode === 'none' ? 1 : (isHighlighted ? 1 : 0.2);
      
      return {
        id: node.id,
        data: {
          label: (
            <div className="text-center px-2 py-1">
              <div className="font-semibold text-sm truncate">{node.label}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {node.status === 'MASTERED' && '✓ Dominado'}
                {node.status === 'DOUBT' && '? Dúvida'}
                {node.status === 'VISITED' && '○ Visitado'}
                {node.status === 'UNVISITED' && '· Não visitado'}
              </div>
            </div>
          ),
        },
        position: { x: 0, y: 0 },
        style: {
          background: STATUS_COLORS[node.status as NodeStatus],
          color: node.status === 'UNVISITED' ? '#1f2937' : '#ffffff',
          border: `2px solid ${node.status === 'UNVISITED' ? '#d1d5db' : STATUS_COLORS[node.status as NodeStatus]}`,
          borderRadius: '8px',
          padding: '8px',
          width: 180,
          fontSize: '12px',
          cursor: 'pointer',
          opacity,
          transition: 'opacity 0.3s',
        },
      };
    });

    // Filter edges
    const edges: Edge[] = data.edges
      .filter(edge => {
        const bothNodesVisible = filteredNodeIds.has(edge.from) && filteredNodeIds.has(edge.to);
        const matchesEdgeType = edgeTypeFilters.size === 0 || edgeTypeFilters.has(edge.type);
        const matchesTimeline = !showTimeline || 
          (data.nodes.find(n => n.id === edge.from)?.createdAt && 
           new Date(data.nodes.find(n => n.id === edge.from)!.createdAt) <= timelineDate);
        
        return bothNodesVisible && matchesEdgeType && matchesTimeline;
      })
      .map((edge: GraphEdge) => {
        const isHighlighted = highlightedPath.has(edge.id);
        const opacity = highlightMode === 'none' ? 1 : (isHighlighted ? 1 : 0.2);
        
        return {
          id: edge.id,
          source: edge.from,
          target: edge.to,
          label: edge.label,
          type: 'smoothstep',
          animated: edge.type === 'PREREQUISITE' && isHighlighted,
          style: {
            stroke: edge.type === 'PREREQUISITE' ? '#ef4444' : '#6b7280',
            strokeWidth: isHighlighted ? 3 : 2,
            opacity,
            transition: 'opacity 0.3s, stroke-width 0.3s',
          },
          labelStyle: {
            fontSize: 10,
            fill: '#6b7280',
          },
        };
      });

    return getLayoutedElements(nodes, edges, isMobile);
  }, [data, statusFilters, searchQuery, confidenceRange, edgeTypeFilters, showTimeline, timelineDate, highlightedPath, highlightMode, isMobile]);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  React.useEffect(() => {
    onNodesChange([{ type: 'reset', item: initialNodes }] as any);
    onEdgesChange([{ type: 'reset', item: initialEdges }] as any);
  }, [initialNodes, initialEdges]);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-2" />
          <p className="text-sm text-gray-600 dark:text-gray-400">Carregando grafo...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <p className="text-sm text-red-600 dark:text-red-400">Erro ao carregar grafo</p>
          <p className="text-xs text-gray-500 mt-1">{(error as Error).message}</p>
        </div>
      </div>
    );
  }

  if (!data || data.nodes.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Nenhum grafo disponível para este conteúdo
          </p>
          <p className="text-xs text-gray-500 mt-1">
            O grafo será gerado automaticamente conforme você estuda
          </p>
        </div>
      </div>
    );
  }

  const allEdgeTypes = Array.from(new Set(data.edges.map(e => e.type)));
  const minDate = data.nodes.reduce((min, node) => {
    const date = new Date(node.createdAt);
    return date < min ? date : min;
  }, new Date());

  return (
    <div className="h-full w-full bg-gray-50 dark:bg-gray-900 relative">
      {/* Toolbar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-4 left-4 z-10 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-3 space-y-3 max-w-xs"
      >
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Buscar tópico..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-8 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Status Filters */}
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Filtros</p>
          {(['MASTERED', 'DOUBT', 'VISITED', 'UNVISITED'] as NodeStatus[]).map((status) => (
            <label key={status} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={statusFilters.has(status)}
                onChange={() => toggleStatusFilter(status)}
                className="rounded"
              />
              <div className="w-3 h-3 rounded" style={{ backgroundColor: STATUS_COLORS[status] }} />
              <span className="text-xs text-gray-600 dark:text-gray-400">
                {status === 'MASTERED' && 'Dominado'}
                {status === 'DOUBT' && 'Dúvida'}
                {status === 'VISITED' && 'Visitado'}
                {status === 'UNVISITED' && 'Não visitado'}
              </span>
            </label>
          ))}
        </div>

        {/* Advanced Filters Toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full flex items-center justify-between px-2 py-1.5 text-xs bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
        >
          <span>Avançado</span>
          {showAdvanced ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>

        {/* Advanced Filters */}
        <AnimatePresence>
          {showAdvanced && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="space-y-2 overflow-hidden"
            >
              {/* Edge Type Filter */}
              <div>
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Tipo de Aresta</p>
                {allEdgeTypes.map(type => (
                  <label key={type} className="flex items-center gap-2 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={edgeTypeFilters.has(type)}
                      onChange={() => toggleEdgeTypeFilter(type)}
                      className="rounded"
                    />
                    <span className="text-gray-600 dark:text-gray-400">{type}</span>
                  </label>
                ))}
              </div>

              {/* Confidence Range */}
              <div>
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Confiança: {confidenceRange[0]}% - {confidenceRange[1]}%
                </p>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={confidenceRange[0]}
                  onChange={(e) => setConfidenceRange([parseInt(e.target.value), confidenceRange[1]])}
                  className="w-full"
                />
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={confidenceRange[1]}
                  onChange={(e) => setConfidenceRange([confidenceRange[0], parseInt(e.target.value)])}
                  className="w-full"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={downloadImage}
            className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
            disabled={is3DView}
            title={is3DView ? 'Exportar disponível apenas em 2D' : 'Exportar PNG'}
          >
            <Download className="h-3 w-3" />
            Exportar
          </button>
          <button
            onClick={() => setIs3DView(!is3DView)}
            className={`flex items-center justify-center gap-1 px-2 py-1.5 text-xs rounded ${
              is3DView 
                ? 'bg-purple-600 text-white hover:bg-purple-700' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
            title={is3DView ? 'Voltar para 2D' : 'Visualizar em 3D'}
          >
            <Box className="h-3 w-3" />
            {is3DView ? '2D' : '3D'}
          </button>
          {onToggleFullscreen && (
            <button
              onClick={onToggleFullscreen}
              className="flex items-center justify-center px-2 py-1.5 text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
              title={isFullscreen ? 'Minimizar' : 'Tela cheia'}
            >
              {isFullscreen ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
            </button>
          )}
        </div>

        {/* Timeline Toggle */}
        <button
          onClick={() => setShowTimeline(!showTimeline)}
          className="w-full px-2 py-1.5 text-xs bg-purple-600 text-white rounded hover:bg-purple-700"
        >
          {showTimeline ? 'Ocultar' : 'Mostrar'} Linha do Tempo
        </button>
      </motion.div>

      {/* Timeline Controls */}
      <AnimatePresence>
        {showTimeline && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-3 min-w-[400px]"
          >
            <div className="flex items-center gap-2 mb-2">
              <button
                onClick={() => setTimelineDate(minDate)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <SkipBack className="h-4 w-4" />
              </button>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </button>
              <button
                onClick={() => setTimelineDate(new Date())}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <SkipForward className="h-4 w-4" />
              </button>
              <input
                type="range"
                min={minDate.getTime()}
                max={new Date().getTime()}
                value={timelineDate.getTime()}
                onChange={(e) => setTimelineDate(new Date(parseInt(e.target.value)))}
                className="flex-1"
              />
              <span className="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                {timelineDate.toLocaleDateString('pt-BR')}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend */}
      <AnimatePresence>
        {(!isMobile || showLegend) && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="absolute top-4 right-4 z-10 bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300">Legenda</h3>
              {isMobile && (
                <button onClick={() => setShowLegend(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: STATUS_COLORS.MASTERED }} />
                <span className="text-gray-600 dark:text-gray-400">Dominado ({data.metadata.masteredCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: STATUS_COLORS.DOUBT }} />
                <span className="text-gray-600 dark:text-gray-400">Dúvida ({data.metadata.doubtCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: STATUS_COLORS.VISITED }} />
                <span className="text-gray-600 dark:text-gray-400">Visitado ({data.metadata.visitedCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded border-2" style={{ borderColor: STATUS_COLORS.UNVISITED, backgroundColor: '#ffffff' }} />
                <span className="text-gray-600 dark:text-gray-400">Não visitado ({data.metadata.unvisitedCount})</span>
              </div>
              {highlightMode !== 'none' && (
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-purple-600 dark:text-purple-400">
                    {highlightMode === 'upstream' && '↑ Pré-requisitos'}
                    {highlightMode === 'downstream' && '↓ Desbloqueios'}
                  </p>
                  <button
                    onClick={clearHighlight}
                    className="text-xs text-gray-500 hover:text-gray-700 underline mt-1"
                  >
                    Limpar destaque
                  </button>
                </div>
              )}
            </div>
            <p className="text-[10px] text-gray-400 mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
              Shift+Click: Destacar caminho
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {isMobile && !showLegend && (
        <button
          onClick={() => setShowLegend(true)}
          className="absolute top-4 right-4 z-10 bg-white dark:bg-gray-800 rounded-lg shadow-md p-2 border border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-400"
        >
          Legenda
        </button>
      )}

      {/* Graph Visualization - 2D or 3D */}
      {is3DView ? (
        <LearnerGraph3D
          nodes={data.nodes.filter(node => {
            const matchesStatus = statusFilters.has(node.status as NodeStatus);
            const matchesSearch = !searchQuery || 
              node.label.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesConfidence = node.confidence * 100 >= confidenceRange[0] && 
                                      node.confidence * 100 <= confidenceRange[1];
            const matchesTimeline = !showTimeline || 
              new Date(node.createdAt) <= timelineDate;
            return matchesStatus && matchesSearch && matchesConfidence && matchesTimeline;
          })}
          edges={data.edges.filter(edge => {
            const matchesEdgeType = edgeTypeFilters.size === 0 || edgeTypeFilters.has(edge.type);
            return matchesEdgeType;
          })}
          onNodeClick={(node) => {
            const nav = node.navigationContext;
            if (nav?.pageNumber) {
              onNavigate?.(nav.pageNumber);
              toast.info(`Navegando para página ${nav.pageNumber}`);
            } else {
              setSelectedNode(node);
            }
          }}
        />
      ) : (
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange as OnNodesChange}
          onEdgesChange={onEdgesChange as OnEdgesChange}
          onNodeClick={handleNodeClick}
          onNodeContextMenu={handleNodeRightClick}
          fitView
          attributionPosition="bottom-right"
          minZoom={0.1}
          maxZoom={2}
        >
          <Background color="#aaa" gap={16} />
          <Controls />
          <MiniMap
            nodeColor={(node) => {
              const status = data.nodes.find((n) => n.id === node.id)?.status;
              return status ? STATUS_COLORS[status as NodeStatus] : '#9ca3af';
            }}
            maskColor="rgba(0, 0, 0, 0.1)"
          />
        </ReactFlow>
      )}

      {/* Node Details Sheet */}
      <NodeDetailsSheet 
        node={selectedNode} 
        onClose={() => setSelectedNode(null)}
        policy={policy}
        userRole={userRole}
      />
    </div>
  );
}
